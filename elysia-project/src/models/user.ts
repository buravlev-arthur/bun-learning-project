import { t } from 'elysia';

export const userBody =  t.Object({
    username: t.String(),
    password: t.String({
        minLength: 6,
    })
});


export const userParams = t.Object({
    id: t.Numeric()
});
