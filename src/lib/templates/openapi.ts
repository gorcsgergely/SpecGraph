export const metadata = {
  name: "OpenAPI Specification",
  description: "OpenAPI 3.1 YAML skeleton for REST API documentation with paths, schemas, and security definitions",
  suggestedFormat: "yaml" as const,
};

export const content = `openapi: "3.1.0"
info:
  title: "[API Name]"
  version: "1.0.0"
  description: "[Brief description of this API]"

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://sandbox.example.com/v1
    description: Sandbox

security:
  - bearerAuth: []

paths:
  /resource:
    get:
      summary: List resources
      operationId: listResources
      tags: [resources]
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  items:
                    type: array
                    items:
                      $ref: "#/components/schemas/Resource"
                  total:
                    type: integer
        "401":
          $ref: "#/components/responses/Unauthorized"
    post:
      summary: Create resource
      operationId: createResource
      tags: [resources]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateResourceRequest"
      responses:
        "201":
          description: Resource created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Resource"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"

  /resource/{id}:
    get:
      summary: Get resource by ID
      operationId: getResource
      tags: [resources]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Resource"
        "404":
          $ref: "#/components/responses/NotFound"

components:
  schemas:
    Resource:
      type: object
      required: [id, name, createdAt]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateResourceRequest:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
        description:
          type: string

    Error:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
        message:
          type: string

  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
`;
