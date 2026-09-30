export type ContactSettings = {
  email: string;
  careersEmail: string;
  phone: string;
  icpNumber: string;
  publicSecurityNumber: string;
  companyName: string;
  companyAddress: string;
  leadNotificationEmails: string[];
  wechatQrCode: string;
  xiaohongshuQrCode: string;
  douyinQrCode: string;
};

export type SiteSettings = {
  homeVideoIds: string[];
  contact: ContactSettings;
};
