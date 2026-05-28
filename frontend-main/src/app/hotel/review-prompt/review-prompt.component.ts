import { Component, effect, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../Review/user.service';
import { AuthService } from '../../auth/auth.service';

// ─── Interface ────────────────────────────────────────────────────────────────
export interface ReviewPrompt {
  _id: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  hotelType: string;
  bookingReference: string;
  status: 'pending' | 'dismissed' | 'reviewed';
  nudgeCount: number;
  maxNudges: number;
}

@Component({
  selector: 'app-review-prompt',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './review-prompt.component.html',
  styleUrl: './review-prompt.component.css',
})
export class ReviewPromptComponent {
  private service = inject(UserService);
  private auth = inject(AuthService);
  private router = inject(Router);

  prompt: ReviewPrompt | null = null;
  show = false;
  private loaded = false; // prevent duplicate calls within the same session

  private readonly SESSION_KEY = 'review_prompt_shown';

  constructor() {
    // Re-runs whenever auth.user signal changes (e.g. after login)
    effect(() => {
      const user = this.auth.user();
      const userId = user?._id ?? '';
      if (!userId || this.loaded) return;
      this.loaded = true;

      // Each login session gets a unique key: <userId>_<sessionId stored at login>
      // sessionStorage is cleared on tab close / new login, so reloads within
      // the same tab reuse the same sessionStorage entry — prompt never repeats.
      const sessionKey = `${this.SESSION_KEY}_${userId}`;
      if (sessionStorage.getItem(sessionKey)) return; // already shown this session

      this.service.getPendingPrompts(userId).subscribe({
        next: (prompts) => {
          if (prompts.length > 0) {
            this.prompt = prompts[0];
            this.show = true;
            // Mark as shown for the rest of this session immediately
            sessionStorage.setItem(sessionKey, '1');
          }
        },
        error: (err) => console.error('Prompt error:', err),
      });
    });
  }

  writeReview(): void {
    if (!this.prompt) return;
    this.show = false;
    this.router.navigate(['/hotel/review', this.prompt.hotelId, 'write'], {
      queryParams: {
        entityType: this.prompt.hotelType || 'hotel',
        promptId: this.prompt._id,
      },
    });
  }

  later(): void {
    this.show = false;
  }

  notInterested(): void {
    if (!this.prompt) return;
    this.show = false;
    this.service.dismissPrompt(this.prompt._id).subscribe();
  }
}
