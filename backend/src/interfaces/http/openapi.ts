import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJsdoc from 'swagger-jsdoc';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * OpenAPI spec, assembled by swagger-jsdoc from the @openapi JSDoc blocks in
 * the route files. Component schemas below are the single source of truth for
 * request/response shapes (mirrors the API table in README.md). Additive only —
 * describes the existing routes, changes none of them.
 */
export const openapiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Jackpot Drop — Flash-Sale API',
      version: '1.0.0',
      description:
        'Real-time flash-sale store. Stock is reserved atomically in Redis at ' +
        'add-to-cart time and can never oversell. All routes except /auth/login ' +
        'and /items require `Authorization: Bearer <token>` (the token is the user id).',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string', example: 'Alice' } },
        },
        Session: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '6a465e347bbe6061d535af82' },
            name: { type: 'string', example: 'Alice' },
            token: { type: 'string', example: '6a465e347bbe6061d535af82' },
          },
        },
        Item: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'High Roller Watch' },
            description: { type: 'string' },
            price: { type: 'number', format: 'float', example: 299.5 },
            remaining: { type: 'integer', example: 3 },
            imageUrl: { type: 'string' },
          },
        },
        AddToCartRequest: {
          type: 'object',
          required: ['itemId'],
          properties: {
            itemId: { type: 'string' },
            qty: { type: 'integer', minimum: 1, default: 1, example: 1 },
          },
        },
        AddToCartResponse: {
          type: 'object',
          properties: {
            cartItemId: { type: 'string' },
            remaining: { type: 'integer', example: 2 },
          },
        },
        RemoveFromCartRequest: {
          type: 'object',
          required: ['itemId'],
          properties: { itemId: { type: 'string' } },
        },
        RemoveFromCartResponse: {
          type: 'object',
          properties: { remaining: { type: 'integer', example: 3 } },
        },
        CartLine: {
          type: 'object',
          properties: {
            itemId: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number', format: 'float' },
            imageUrl: { type: 'string' },
            qty: { type: 'integer', example: 2 },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            lines: { type: 'array', items: { $ref: '#/components/schemas/CartLine' } },
            total: { type: 'number', format: 'float', example: 99.97 },
          },
        },
        OrderLine: {
          type: 'object',
          properties: {
            itemId: { type: 'string' },
            qty: { type: 'integer' },
            price: { type: 'number', format: 'float' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            total: { type: 'number', format: 'float', example: 99.97 },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderLine' } },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string', example: 'OUT_OF_STOCK' },
          },
        },
      },
    },
  },
  // Scan both TS source (tsx dev) and compiled JS (prod build) for @openapi blocks.
  apis: [
    join(__dirname, 'routes.ts'),
    join(__dirname, 'routes.js'),
  ],
});
