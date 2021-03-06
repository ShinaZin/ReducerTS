import * as dateFns from 'date-fns';
import * as fs from 'fs-extra';
import * as nodemailer from 'nodemailer';
import * as sgTransport from 'nodemailer-sendgrid-transport';

import pathHelper from './pathHelper';
import config from '../config';
import templateRenderer from './templateRenderHelper';

export default {
  sendEmail,
  sendEmailTemplate
};

interface EmailOptions {
  from: string;
  to: string;
  subject?: string;
  html?: string;
}

interface EmailData {
  siteRootUrl: string,
  token: string
}

function getEmailTransport() {
  let transportOptions = {
    service: 'gmail',
    auth: {
      user: config.email.auth.user,
      pass: config.email.auth.password
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  //use SendGrid if available
  if (config.email.sendGridKey) {
    transportOptions = sgTransport({
      auth: {
        api_key: config.email.sendGridKey
      }
    });
  }

  return nodemailer.createTransport(transportOptions);
}

async function sendEmailTemplate(templateName: string, emailData: EmailData, emailOptions: EmailOptions) {
  try {
    const response = await renderTemplate(templateName, emailData);

    emailOptions.html = response.body;

    if (!emailOptions.subject) emailOptions.subject = response.subject;

    if (config.email.useStubs && config.isDevLocal) {
      await sendStubEmail(emailOptions);
    } else {
      await sendEmail(emailOptions);
    }
  } catch (err) {
    console.log(err+'\nCannot render email template');
  }
}

async function renderTemplate(name: string, data: EmailData): Promise<any> {
  const result = {
    body: null,
    subject: null
  };

  const bodyFileName = pathHelper.getDataRelative('emails', name, 'body.hbs');
  const bodyExists = await fs.pathExists(bodyFileName);

  if (!bodyExists) throw new Error(`Cannot find email template file at ${bodyFileName}`);

  result.body = await templateRenderer.renderTemplate(bodyFileName, data);

  const subjectFileName = pathHelper.getDataRelative('emails', name, 'subject.hbs');
  const subjectExists = await fs.pathExists(bodyFileName);

  if (subjectExists) {
    result.subject = await templateRenderer.renderTemplate(subjectFileName, data);
  }

  return result;
}

function sendEmail(emailData: EmailOptions): Promise<Object> {
  const emailTransport = getEmailTransport();

  return new Promise<Object>((resolve, reject) => {
    emailTransport.sendMail(emailData, (error, info) => {
      if (error) return reject(error);

      return resolve(info);
    });
  });
}

async function sendStubEmail(mailOptions) {
  try {
    const { from, to, subject, html } = mailOptions;

    const nowDateStr = dateFns.format(new Date(), 'YYYY-MM-DD_HH-mm-ss-x');
    const fileName = `${nowDateStr}_${to}_${subject}.html`;

    const emailStubsFolder = pathHelper.getLocalRelative('./emails');

    fs.ensureDirSync(emailStubsFolder);

    const filePath = pathHelper.getLocalRelative('./emails', fileName);

    fs.writeFileSync(filePath, html);
    console.log(`Auth token: \n${(<string>html).match(/(\")(.*)(\")/)[2] as string}`);
  } catch (err) {
    console.log(err+'\nCannot send stub email.');
  }
}
