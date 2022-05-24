import SimpleSchema from 'simpl-schema';

export const jwtRequestSchema = new SimpleSchema({
    username: String,
    userAgent: String,
});
