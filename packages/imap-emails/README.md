# imap-emails

[![npm](https://img.shields.io/npm/v/imap-emails)](https://www.npmjs.com/package/imap-emails)

**ImapEmails** is wrapping "_imap_" and "_mailparser_" library and exposes simple interface to fetch your latest emails from Gmail or any other inbox supporting IMAP

## How to install

```bash
npm install imap-emails
```

or

```bash
yarn add imap-emails
```

_Typescript types are already there, no need to install additional `@types/...` package._

## How to use

Fetching gmail emails since 1st of September 2022:

```typescript
const imapEmails = new ImapEmails({
  username: 'example@gmail.com',
  password: 'example-gmail-app-password',
});

await imapEmails.connect();

const emails = await imapEmails.getEmails({
  since: new Date('2022-09-01T00:00:00.000Z'),
});

await imapEmails.disconnect();
```

If you want to tweak IMAP settings or connect to some other inbox then Gmail you can provide `imapConfig` prop in the constructor:

```typescript
const imapEmails = new ImapEmails({
  username: 'example@gmail.com',
  password: 'example-gmail-app-password',
  imapConfig: {
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: {
      servername: 'imap.gmail.com',
    },
  },
});
```

## Gmail password

If you're using Gmail you need to set up "App Password". You will not be able to use your regular Gmail password.

Check out this for example:

https://support.google.com/accounts/answer/185833?hl=en

---

This project was generated using `nx`.
