import { MailUploadURL, MailSendURL } from './index';

/**
 * Upload an attachment file to the Mail API
 * @param {File} file
 * @returns {Promise<{success: boolean, fileId?: string, fileName?: string, size?: number, error?: {message: string}}>}
 */
export const uploadMailAttachment = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(MailUploadURL, {
      method: 'POST',
      headers: {
        accept: '*/*',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: { message: errorText || `Upload failed (${response.status})` },
      };
    }

    const data = await response.json();
    if (data && data.success && data.fileId) {
      return {
        success: true,
        fileId: data.fileId,
        fileName: data.fileName || file.name,
        size: data.size ?? file.size,
      };
    }

    return {
      success: false,
      error: { message: data?.message || 'Upload attachment failed' },
    };
  } catch (error) {
    return {
      success: false,
      error: { message: error?.message || 'Network error while uploading attachment' },
    };
  }
};

/**
 * Send email via Mail API
 * @param {Object} payload
 * @param {string} payload.from
 * @param {string} payload.to
 * @param {string} [payload.cc]
 * @param {string} [payload.bcc]
 * @param {string} payload.subject
 * @param {string} payload.body
 * @param {boolean} [payload.isHtml]
 * @param {string[]} [payload.attachments]
 * @returns {Promise<{success: boolean, data?: any, error?: {message: string}}>}
 */
export const sendMail = async ({
  from = 'it.daas@dskorea.com',
  to,
  cc = '',
  bcc = '',
  subject,
  body,
  isHtml = true,
  attachments = [],
}) => {
  try {
    const response = await fetch(MailSendURL, {
      method: 'POST',
      headers: {
        accept: 'text/plain',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: String(from || '').trim(),
        to: String(to || '').trim(),
        cc: String(cc || '').trim(),
        bcc: String(bcc || '').trim(),
        subject: String(subject || '').trim(),
        body: String(body || ''),
        isHtml: Boolean(isHtml),
        attachments: Array.isArray(attachments) ? attachments : [],
      }),
    });

    const responseText = await response.text();
    let parsed = null;
    try {
      parsed = responseText ? JSON.parse(responseText) : null;
    } catch {
      parsed = responseText;
    }

    if (!response.ok) {
      return {
        success: false,
        error: {
          message:
            (parsed && typeof parsed === 'object' && (parsed.message || parsed.error)) ||
            (typeof parsed === 'string' && parsed) ||
            `Send mail failed (${response.status})`,
        },
      };
    }

    if (parsed && typeof parsed === 'object' && parsed.success === false) {
      return {
        success: false,
        error: { message: parsed.message || 'Send mail failed' },
      };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    return {
      success: false,
      error: { message: error?.message || 'Network error while sending email' },
    };
  }
};
