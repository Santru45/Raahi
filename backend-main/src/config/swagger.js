import swaggerJsdoc from "swagger-jsdoc";

console.log("Swagger Started : config/swagger.js");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Raahi Admin API",
      version: "1.0.0",
      description:
        "REST API for the Raahi Admin Dashboard. Manage hotels, rooms, bookings, and users. All endpoints require an admin JWT token via Bearer Auth.",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT token for authenticated users. Obtain from POST /auth/login.",
        },
        AdminAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            'Admin-only JWT token. The user must have role: "admin". A non-admin token will return 403 Forbidden.',
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────────────
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "admin@example.com" },
            password: { type: "string", example: "secret123" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        // ── User ──────────────────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["customer", "admin"] },
          },
        },
        // ── Hotel ─────────────────────────────────────────────────────────
        Hotel: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            city: { type: "string" },
            country: { type: "string" },
            hotelType: { type: "string" },
            starRating: { type: "number" },
            amenities: { type: "array", items: { type: "string" } },
            images: { type: "array", items: { type: "string" } },
            description: { type: "string" },
          },
        },
        // ── Room ──────────────────────────────────────────────────────────
        Room: {
          type: "object",
          properties: {
            _id: { type: "string" },
            hotelId: { type: "string" },
            roomType: { type: "string" },
            pricePerNight: { type: "number" },
            maxOccupancy: { type: "number" },
            isAvailable: { type: "boolean" },
          },
        },
        // ── Hotel Booking ─────────────────────────────────────────────────
        HotelBooking: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            hotelId: { type: "string" },
            roomId: { type: "string" },
            checkIn: { type: "string", format: "date" },
            checkOut: { type: "string", format: "date" },
            totalPrice: { type: "number" },
            bookingStatus: {
              type: "string",
              enum: ["confirmed", "cancelled", "completed"],
            },
            paymentStatus: { type: "string", enum: ["paid", "refunded"] },
            bookingReference: { type: "string" },
          },
        },
        // ── Review ───────────────────────────────────────────────────────
        Review: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            entityId: { type: "string" },
            entityType: { type: "string" },
            rating: { type: "number", minimum: 0, maximum: 5 },
            comment: { type: "string" },
            year: { type: "number" },
            images: { type: "array", items: { type: "string" } },
            isVerified: { type: "boolean" },
            createdAt: { type: "string" },
            subrating: {
              type: "object",
              properties: {
                cleanliness: { type: "number" },
                service: { type: "number" },
                location: { type: "number" },
                food: { type: "number" },
                facilities: { type: "number" },
                staff: { type: "number" },
              },
            },
          },
        },
        // ── Loyalty ──────────────────────────────────────────────────────
        LoyaltyAccount: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            coinBalance: { type: "number" },
            totalEarned: { type: "number" },
            tier: {
              type: "string",
              enum: ["bronze", "silver", "gold", "platinum"],
            },
            earnMultiplier: { type: "number" },
            maxRedeemPercent: { type: "number" },
          },
        },
        // ── Wallet ───────────────────────────────────────────────────────
        Wallet: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            balance: { type: "number" },
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["topup", "debit", "refund"] },
                  amount: { type: "number" },
                  note: { type: "string" },
                  createdAt: { type: "string" },
                },
              },
            },
          },
        },
        // ── Travel Service ───────────────────────────────────────────────
        TravelService: {
          type: "object",
          properties: {
            _id: { type: "string" },
            type: {
              type: "string",
              enum: ["flight", "train", "bus"],
              example: "flight",
            },
            operatorName: { type: "string", example: "IndiGo" },
            serviceNumber: { type: "string", example: "6E-2345" },
            from: { type: "string", example: "Chennai" },
            to: { type: "string", example: "Delhi" },
            schedule: {
              type: "object",
              properties: {
                departureTime: {
                  type: "string",
                  format: "date-time",
                  example: "2026-06-15T06:00:00.000Z",
                },
                arrivalTime: {
                  type: "string",
                  format: "date-time",
                  example: "2026-06-15T09:30:00.000Z",
                },
                duration: { type: "string", example: "3h 30m" },
              },
            },
            fare: { type: "number", example: 4500 },
            marketRate: { type: "number", example: 5200 },
            totalSeats: { type: "number", example: 180 },
            availableSeats: { type: "number", example: 45 },
            cabinClass: { type: "string", example: "Economy" },
            amenities: {
              type: "array",
              items: { type: "string" },
              example: ["WiFi", "Meals", "Entertainment"],
            },
            taxPercent: { type: "number", example: 12 },
            isActive: { type: "boolean", example: true },
            bookedSeats: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  seatNumber: { type: "string" },
                  serviceId: { type: "string" },
                },
              },
            },
          },
        },
        // ── Travel Location ──────────────────────────────────────────────
        TravelLocation: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Chennai International Airport" },
            city: { type: "string", example: "Chennai" },
            code: { type: "string", example: "MAA" },
            type: {
              type: "string",
              enum: ["flight", "train", "bus"],
              example: "flight",
            },
          },
        },
        // ── Boarding Point ───────────────────────────────────────────────
        BoardingPoint: {
          type: "object",
          properties: {
            _id: { type: "string" },
            serviceId: { type: "string" },
            type: { type: "string", enum: ["flight", "train", "bus"] },
            name: { type: "string", example: "Terminal 1" },
            address: { type: "string", example: "Airport Road, Chennai" },
            time: { type: "string", example: "05:30 AM" },
          },
        },
        // ── Booked Seat ──────────────────────────────────────────────────
        BookedSeat: {
          type: "object",
          properties: {
            _id: { type: "string" },
            serviceId: { type: "string" },
            seatNumber: { type: "string", example: "12A" },
            bookingId: { type: "string" },
          },
        },
        // ── Travel Booking ───────────────────────────────────────────────
        TravelBooking: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            serviceId: { type: "string" },
            serviceSnapshot: {
              type: "object",
              properties: {
                type: { type: "string" },
                operatorName: { type: "string" },
                serviceNumber: { type: "string" },
                from: { type: "string" },
                to: { type: "string" },
                departureTime: { type: "string" },
                arrivalTime: { type: "string" },
                cabinClass: { type: "string" },
              },
            },
            passengers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  age: { type: "number" },
                  gender: { type: "string", enum: ["male", "female"] },
                  seatNumber: { type: "string" },
                  isPrimary: { type: "boolean" },
                  idType: { type: "string" },
                  idNumber: { type: "string" },
                },
              },
            },
            boardingPoint: { type: "string" },
            droppingPoint: { type: "string" },
            totalFare: { type: "number", example: 9500 },
            taxAmount: { type: "number", example: 1140 },
            discountAmount: { type: "number", example: 0 },
            finalAmount: { type: "number", example: 10640 },
            bookingReference: { type: "string", example: "TRV123456" },
            bookingStatus: {
              type: "string",
              enum: ["confirmed", "cancelled"],
              example: "confirmed",
            },
            paymentStatus: {
              type: "string",
              enum: ["paid", "pending", "refunded"],
              example: "paid",
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Error ────────────────────────────────────────────────────────
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
