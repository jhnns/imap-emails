import Imap from 'imap';
import { ParsedMail, simpleParser } from 'mailparser';

export type ImapConfig = Omit<Imap.Config, 'user' | 'password'>;

const GMAIL_IMAP_CONFIG: ImapConfig = {
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: {
    servername: 'imap.gmail.com',
  },
};

export interface ImapEmailsProps {
  /**
   * If you're using Gmail, this is your email address
   */
  username: string;
  /**
   * If you're using Gmail you need to set up "App Password".
   * You will not be able to use your regular Gmail password.
   * Check out this for example:
   * https://support.google.com/accounts/answer/185833?hl=en
   */
  password: string;
  /**
   * Default configuration is connecting to gmail
   * @example
   * const GMAIL_IMAP_CONFIG: ImapConfig = {
   *   host: 'imap.gmail.com',
   *   port: 993,
   *   tls: true,
   *   tlsOptions: {
   *     servername: 'imap.gmail.com',
   *   },
   * };
   */
  imapConfig?: Omit<Imap.Config, 'user' | 'password'>;
}

export interface GetEmailsStreamsProps {
  since: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetEmailsProps extends GetEmailsStreamsProps {}

/**
 * ImapEmails is wrapping "imap" and "mailparser" library and exposes
 * simple interface to fetch your latest emails from Gmail or any
 * other inbox supporting IMAP
 * @example
 * const imapEmails = await ImapEmails({
 *   username: 'example@gmail.com',
 *   password: 'example-gmail-app-password'
 * });
 *
 * await imapEmails.connect();
 *
 * const emails = await imapEmails.getEmails({ since: new Date('2022-09-01T00:00:00.000Z') });
 *
 * await imapEmails.disconnect();
 */
export class ImapEmails {
  private imap: Imap;

  constructor({
    username,
    password,
    imapConfig = GMAIL_IMAP_CONFIG,
  }: ImapEmailsProps) {
    this.imap = new Imap({
      user: username,
      password,
      ...imapConfig,
    });
  }

  public connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.imap.once('ready', () => {
        resolve();
      });

      this.imap.once('error', (err: unknown) => {
        reject(err);
      });

      this.imap.connect();
    });
  }

  public disconnect(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.imap.once('end', () => {
        resolve();
      });

      this.imap.end();
    });
  }

  private _getEmailsStreams({
    since,
  }: GetEmailsStreamsProps): Promise<NodeJS.ReadableStream[]> {
    return new Promise<NodeJS.ReadableStream[]>((resolve, reject) => {
      const emailsStreams: NodeJS.ReadableStream[] = [];

      this.imap.openBox('INBOX', true, (err) => {
        if (err) reject(err);

        this.imap.search(['ALL', ['SINCE', since]], (err, uids) => {
          if (err) reject(err);
          if (uids.length === 0) return resolve([]);

          const f = this.imap.fetch(uids, { bodies: '' });

          f.on('message', (msg) => {
            msg.on('body', async (stream) => {
              emailsStreams.push(stream);
            });
          });

          f.once('error', (err) => {
            reject(err);
          });

          f.once('end', () => {
            resolve(emailsStreams);
          });
        });
      });
    });
  }

  public async getEmails({ since }: GetEmailsProps): Promise<ParsedMail[]> {
    const emailsStreams = await this._getEmailsStreams({ since });
    return await Promise.all(
      emailsStreams.map((emailStream) => simpleParser(emailStream))
    );
  }
}
