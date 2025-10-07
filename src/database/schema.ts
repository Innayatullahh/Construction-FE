import { RxJsonSchema } from 'rxdb';

export const userSchema: RxJsonSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    name: {
      type: 'string',
      maxLength: 100,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
  },
  required: ['id', 'name', 'createdAt'],
};

export const taskSchema: RxJsonSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    userId: {
      type: 'string',
      maxLength: 100,
    },
    title: {
      type: 'string',
      maxLength: 200,
    },
    description: {
      type: 'string',
      maxLength: 1000,
    },
    status: {
      type: 'string',
      enum: ['not-started', 'in-progress', 'blocked', 'completed'],
    },
    position: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
      },
    },
    checklist: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', maxLength: 100 },
          text: { type: 'string', maxLength: 500 },
          status: {
            type: 'string',
            enum: ['not-started', 'in-progress', 'blocked', 'completed'],
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'text', 'status', 'createdAt'],
      },
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
    },
  },
  required: ['id', 'userId', 'title', 'status', 'checklist', 'createdAt', 'updatedAt'],
};

export const syncStateSchema: RxJsonSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    lastSync: { type: 'string', format: 'date-time' },
    isOnline: { type: 'boolean' },
  },
  required: ['id', 'lastSync', 'isOnline'],
};
