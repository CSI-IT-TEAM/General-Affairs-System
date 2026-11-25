import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Send,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  AlertTriangle,
  Eye,
  Code2,
  User,
  Calendar,
  Building2,
  Quote,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Carousel/ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { uploadMailAttachment, sendMail } from '../../api/mail';
import { saveGrievanceFeedback } from '../../api/grievance';
import { decodeBase64UTF8, encodeBase64UTF8 } from '../../lib/base64Utils';

const DEFAULT_FROM_EMAIL = 'it.daas@dskorea.com';

const decodeReasonBase64 = (reason) => {
  if (!reason || typeof reason !== 'string') return '';
  const trimmed = reason.trim();
  if (!trimmed) return '';
  // Only decode if it looks like valid base64 (avoids corrupting already-decoded plain text)
  const isLikelyBase64 =
    trimmed.length >= 4 &&
    trimmed.length % 4 === 0 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed);
  if (!isLikelyBase64) return trimmed;
  try {
    const decoded = decodeBase64UTF8(trimmed);
    const hasControlChar = Array.from(decoded).some((ch) => {
      const code = ch.charCodeAt(0);
      return (code >= 0 && code <= 8) || (code >= 14 && code <= 31);
    });
    if (decoded && !hasControlChar) {
      return decoded;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const escapeHtml = (text) =>
  String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const formatReplyToHtml = (text) => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return '';
  // If user already entered HTML tags, send as-is
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">${escapeHtml(trimmed).replace(/\n/g, '<br/>')}</div>`;
};

const buildEmailHtml = (quotedReason, replyText, quoteLabel) => {
  const replyHtml = formatReplyToHtml(replyText);
  const cleanQuote = String(quotedReason || '').trim();

  if (!cleanQuote) {
    return replyHtml;
  }

  const quoteHtml = `
    <blockquote style="margin: 0 0 16px 0; padding: 12px 16px; border-left: 4px solid #4f46e5; background-color: #f8fafc; border-radius: 0 8px 8px 0; font-family: Arial, sans-serif;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6366f1; margin-bottom: 6px;">${escapeHtml(quoteLabel)}</div>
      <div style="font-size: 13.5px; line-height: 1.6; color: #475569; font-style: italic;">${escapeHtml(cleanQuote).replace(/\n/g, '<br/>')}</div>
    </blockquote>
  `.trim();

  return `<div style="font-family: Arial, sans-serif;">${quoteHtml}${replyHtml}</div>`;
};

const FeedbackEmailDialog = ({ isOpen, onClose, itemData, onSentSuccess }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [from, setFrom] = useState(DEFAULT_FROM_EMAIL);
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [quotedReason, setQuotedReason] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const [sending, setSending] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && itemData) {
      const recipientEmail = String(itemData.EMAIL ?? itemData.email ?? '').trim();
      const recipientName = itemData.RECIPIENT || itemData.EMP_NM || '';
      const decodedReason = decodeReasonBase64(itemData.REASON ?? itemData.reason ?? '');
      setFrom(DEFAULT_FROM_EMAIL);
      setTo(recipientEmail);
      setCc('');
      setBcc('');
      setSubject(
        recipientName
          ? `[Feedback] ${t('grievance_title')} - ${recipientName}`
          : `[Feedback] ${t('grievance_title')}`
      );
      setQuotedReason(decodedReason);
      setBody('');
      setAttachments([]);
      setShowPreview(false);
      setErrorMessage('');
      setStatusText('');
      setSending(false);
    }
  }, [isOpen, itemData, t]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setAttachments((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
      const uniqueNew = selectedFiles.filter(
        (f) => !existingKeys.has(`${f.name}-${f.size}-${f.lastModified}`)
      );
      return [...prev, ...uniqueNew];
    });

    // Reset input so user can re-select same file if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedFrom = from.trim();
    const trimmedTo = to.trim();
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    if (!trimmedFrom) {
      setErrorMessage(t('grievance_feedback_err_from'));
      return;
    }
    if (!trimmedTo) {
      setErrorMessage(t('grievance_feedback_err_to'));
      return;
    }
    if (!trimmedSubject) {
      setErrorMessage(t('grievance_feedback_err_subject'));
      return;
    }
    if (!trimmedBody) {
      setErrorMessage(t('grievance_feedback_err_body'));
      return;
    }

    setSending(true);
    try {
      const uploadedFileIds = [];

      if (attachments.length > 0) {
        for (let i = 0; i < attachments.length; i++) {
          const file = attachments[i];
          setStatusText(
            t('grievance_feedback_uploading', {
              current: i + 1,
              total: attachments.length,
            })
          );
          const uploadRes = await uploadMailAttachment(file);
          if (!uploadRes.success || !uploadRes.fileId) {
            setErrorMessage(
              uploadRes.error?.message ||
                t('grievance_feedback_upload_failed', { name: file.name })
            );
            setSending(false);
            setStatusText('');
            return;
          }
          uploadedFileIds.push(uploadRes.fileId);
        }
      }

      setStatusText(t('grievance_feedback_sending'));
      const htmlBody = buildEmailHtml(quotedReason, trimmedBody, t('praised_reason'));

      const sendRes = await sendMail({
        from: trimmedFrom,
        to: trimmedTo,
        cc: cc.trim(),
        bcc: bcc.trim(),
        subject: trimmedSubject,
        body: htmlBody,
        isHtml: true,
        attachments: uploadedFileIds,
      });

      if (!sendRes.success) {
        setErrorMessage(sendRes.error?.message || t('grievance_feedback_send_failed'));
        return;
      }

      // Save feedback record to Oracle via UPLOAD_GRIEVANCE_FEEDBACK
      let currentEmpId = '';
      try {
        const userData = sessionStorage.getItem('userData');
        const parsedUser = userData ? JSON.parse(userData) : null;
        currentEmpId = parsedUser?.EMPID || '';
      } catch {
        currentEmpId = '';
      }

      const praiseId = itemData?.PRAISE_ID ?? itemData?.ID ?? '';
      let savedToTable = false;
      let saveWarning = null;
      if (praiseId !== '') {
        const saveRes = await saveGrievanceFeedback({
          argPraiseId: praiseId,
          argMailFrom: trimmedFrom,
          argMailTo: trimmedTo,
          argMailCc: cc.trim(),
          argMailBcc: bcc.trim(),
          argSubject: encodeBase64UTF8(trimmedSubject),
          argMessage: encodeBase64UTF8(htmlBody),
          argIsHtml: 'Y',
          argAttachments: uploadedFileIds.join(','),
          argAttachmentsCount: uploadedFileIds.length,
          argSendStatus: 'SUCCESS',
          argErrorMsg: '',
          argPic: currentEmpId,
        });

        if (saveRes.success) {
          savedToTable = true;
        } else {
          console.warn('Email sent but failed to save feedback log:', saveRes.error);
          saveWarning = saveRes.error?.message || null;
        }
      }

      if (onSentSuccess) {
        onSentSuccess(trimmedTo, { praiseId, savedToTable, saveWarning });
      }
      onClose();
    } catch (err) {
      setErrorMessage(err?.message || t('grievance_feedback_send_failed'));
    } finally {
      setSending(false);
      setStatusText('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !sending && onClose()}>
      <DialogContent className="w-[95vw] max-w-[680px] max-h-[92vh] overflow-hidden p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-white dark:from-slate-800/80 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25 shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div className="text-left min-w-0">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t('grievance_feedback_dialog_title')}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                {t('grievance_feedback_dialog_desc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 custom-scrollbar">
            {/* Reference Info Strip */}
            {itemData && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                {itemData.EMP_NM && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-slate-400">{t('praiser')}:</span>
                    <strong className="text-slate-800 dark:text-slate-100">{itemData.EMP_NM}</strong>
                  </span>
                )}
                {itemData.DEPT_NM && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{itemData.DEPT_NM}</span>
                  </span>
                )}
                {itemData.PRAISE_DATE && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{itemData.PRAISE_DATE}</span>
                  </span>
                )}
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900/60 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="break-words">{errorMessage}</span>
              </div>
            )}

            {/* From & To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('grievance_feedback_from')} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  value={from}
                  readOnly
                  disabled
                  placeholder="it.daas@dskorea.com"
                  className="h-9 text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('grievance_feedback_to')} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={sending}
                  placeholder="recipient@company.com"
                  className="h-9 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* CC & BCC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CC
                </label>
                <Input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  disabled={sending}
                  placeholder={t('grievance_feedback_cc_placeholder')}
                  className="h-9 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  BCC
                </label>
                <Input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  disabled={sending}
                  placeholder={t('grievance_feedback_bcc_placeholder')}
                  className="h-9 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('grievance_feedback_subject')} <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
                placeholder={t('grievance_feedback_subject_placeholder')}
                className="h-9 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Quoted Reason Block */}
            {quotedReason && (
              <div className="rounded-r-xl rounded-l-sm border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 border-y border-r border-indigo-100 dark:border-indigo-900/50 px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                  <Quote className="h-3.5 w-3.5 shrink-0" />
                  <span>{t('praised_reason')}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed whitespace-pre-wrap break-words max-h-[110px] overflow-y-auto custom-scrollbar">
                  {quotedReason}
                </p>
              </div>
            )}

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('grievance_feedback_body')} <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {showPreview ? (
                    <>
                      <Code2 className="h-3.5 w-3.5" />
                      {t('grievance_feedback_edit_mode')}
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      {t('grievance_feedback_preview_html')}
                    </>
                  )}
                </button>
              </div>

              {showPreview ? (
                <div
                  className="min-h-[150px] max-h-[240px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-800 dark:text-slate-100"
                  dangerouslySetInnerHTML={{
                    __html:
                      buildEmailHtml(quotedReason, body, t('praised_reason')) ||
                      `<span style="color:#94a3b8">${t('grievance_feedback_empty_preview')}</span>`,
                  }}
                />
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={sending}
                  rows={5}
                  placeholder={t('grievance_feedback_body_placeholder')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-y min-h-[120px]"
                />
              )}
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                  {t('grievance_feedback_attachments')}
                  {attachments.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                      {attachments.length}
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {t('grievance_feedback_add_file')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {attachments.length > 0 ? (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                  {attachments.map((file, idx) => {
                    const isImage = file.type?.startsWith('image/');
                    return (
                      <div
                        key={`${file.name}-${file.size}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 px-3 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isImage ? (
                            <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                          )}
                          <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                            {file.name}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          disabled={sending}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                          title={t('btn_cancel')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  onClick={() => !sending && fileInputRef.current?.click()}
                  className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-3 text-center text-xs text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:border-indigo-700 transition-colors cursor-pointer"
                >
                  {t('grievance_feedback_attachments_hint')}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="shrink-0 flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={sending}
              className="font-semibold"
            >
              {t('btn_cancel')}
            </Button>
            <Button
              type="submit"
              disabled={sending}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-md shadow-indigo-500/25 transition-all"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {statusText || t('grievance_feedback_sending')}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Send className="h-4 w-4" />
                  {t('grievance_feedback_send')}
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackEmailDialog;
