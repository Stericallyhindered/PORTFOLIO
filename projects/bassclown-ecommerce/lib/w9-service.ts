import { db, users, w9Forms, contests, giveaways } from '@/lib/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { emailService } from '@/lib/email-service';

export interface W9FormData {
  // Business Information
  businessName?: string;
  businessType: 'individual' | 'sole_proprietorship' | 'c_corp' | 's_corp' | 'partnership' | 'trust_estate' | 'llc' | 'other';
  businessTypeOther?: string;
  exemptPayeeCode?: string;
  exemptFromFatca?: boolean;

  // Individual/Business Name and Address
  name: string;
  businessNameLine2?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;

  // Taxpayer Identification Number
  tin: string;
  tinType: 'ssn' | 'ein';
  
  // Certification
  isCertified: boolean;
  certificationDate: Date;
  signatureName: string;
  
  // Additional Information
  accountNumbers?: string[];
  
  // Form Status
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  
  // File Information
  formFileUrl?: string;
  documentFileUrl?: string; // Supporting documents
}

export interface W9Validation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TaxReportingData {
  userId: string;
  year: number;
  totalPrizeValue: number;
  prizeDetails: {
    contestId?: string;
    giveawayId?: string;
    prizeValue: number;
    prizeDescription: string;
    awardedDate: Date;
  }[];
  w9FormId?: string;
  requires1099: boolean;
}

export class W9Service {
  private readonly MIN_REPORTING_THRESHOLD = 600; // IRS threshold for 1099 reporting

  // Create or update W9 form
  async submitW9Form(userId: string, formData: W9FormData): Promise<{ id: string; status: string }> {
    // Validate form data
    const validation = this.validateW9Form(formData);
    if (!validation.isValid) {
      throw new Error(`W9 form validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if user already has a W9 form
    const existingForms = await db
      .select()
      .from(w9Forms)
      .where(eq(w9Forms.userId, userId))
      .orderBy(desc(w9Forms.createdAt));

    const existingForm = existingForms[0];

    const w9Data = {
      userId,
      businessName: formData.businessName,
      businessType: formData.businessType,
      businessTypeOther: formData.businessTypeOther,
      exemptPayeeCode: formData.exemptPayeeCode,
      exemptFromFatca: formData.exemptFromFatca || false,
      payeeName: formData.name,
      businessNameLine2: formData.businessNameLine2,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      taxIdNumber: formData.tin,
      tinType: formData.tinType,
      isCertified: formData.isCertified,
      certificationDate: formData.certificationDate,
      signatureName: formData.signatureName,
      accountNumbers: formData.accountNumbers || [],
      status: 'submitted' as const,
      submittedAt: new Date(),
      formFileUrl: formData.formFileUrl,
      documentFileUrl: formData.documentFileUrl
    };

    let formId: string;

    if (existingForm && existingForm.status === 'draft') {
      // Update existing draft
      await db
        .update(w9Forms)
        .set({ ...w9Data, updatedAt: new Date() })
        .where(eq(w9Forms.id, existingForm.id));
      formId = existingForm.id;
    } else {
      // Create new form
      const result = await db.insert(w9Forms).values(w9Data).returning({ id: w9Forms.id });
      formId = result[0].id;
    }

    // Send notification email
    await this.sendW9SubmissionNotification(userId, formId);

    return {
      id: formId,
      status: 'submitted'
    };
  }

  // Save W9 form as draft
  async saveDraftW9Form(userId: string, formData: Partial<W9FormData>): Promise<{ id: string; status: string }> {
    const existingForms = await db
      .select()
      .from(w9Forms)
      .where(and(eq(w9Forms.userId, userId), eq(w9Forms.status, 'draft')))
      .orderBy(desc(w9Forms.createdAt));

    const w9Data = {
      userId,
      businessName: formData.businessName,
      businessType: formData.businessType || 'individual',
      businessTypeOther: formData.businessTypeOther,
      exemptPayeeCode: formData.exemptPayeeCode,
      exemptFromFatca: formData.exemptFromFatca || false,
      payeeName: formData.name || '',
      businessNameLine2: formData.businessNameLine2,
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      zipCode: formData.zipCode || '',
      taxIdNumber: formData.tin || '',
      tinType: formData.tinType || 'ssn',
      isCertified: formData.isCertified || false,
      certificationDate: formData.certificationDate || new Date(),
      signatureName: formData.signatureName || '',
      accountNumbers: formData.accountNumbers || [],
      status: 'draft' as const,
      formFileUrl: formData.formFileUrl,
      documentFileUrl: formData.documentFileUrl
    };

    let formId: string;

    if (existingForms.length > 0) {
      // Update existing draft
      await db
        .update(w9Forms)
        .set({ ...w9Data, updatedAt: new Date() })
        .where(eq(w9Forms.id, existingForms[0].id));
      formId = existingForms[0].id;
    } else {
      // Create new draft
      const result = await db.insert(w9Forms).values(w9Data).returning({ id: w9Forms.id });
      formId = result[0].id;
    }

    return {
      id: formId,
      status: 'draft'
    };
  }

  // Get user's W9 forms
  async getUserW9Forms(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(w9Forms)
      .where(eq(w9Forms.userId, userId))
      .orderBy(desc(w9Forms.createdAt));
  }

  // Get W9 form by ID
  async getW9FormById(formId: string): Promise<any | null> {
    const forms = await db
      .select()
      .from(w9Forms)
      .where(eq(w9Forms.id, formId));

    return forms[0] || null;
  }

  // Admin: Review W9 form
  async reviewW9Form(
    formId: string, 
    reviewerId: string, 
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<void> {
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    await db
      .update(w9Forms)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: action === 'reject' ? rejectionReason : null,
        updatedAt: new Date()
      })
      .where(eq(w9Forms.id, formId));

    // Get form and user info for notification
    const form = await this.getW9FormById(formId);
    if (form) {
      await this.sendW9ReviewNotification(form.userId, formId, action, rejectionReason);
    }
  }

  // Check if user needs W9 form for tax year
  async checkW9Requirement(userId: string, year: number): Promise<{ required: boolean; reason: string; totalPrizeValue: number }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Get all prizes won in the tax year
    const taxData = await this.getTaxReportingData(userId, year);
    
    const required = taxData.totalPrizeValue >= this.MIN_REPORTING_THRESHOLD;
    
    return {
      required,
      reason: required 
        ? `Total prize value of $${taxData.totalPrizeValue.toFixed(2)} exceeds IRS reporting threshold of $${this.MIN_REPORTING_THRESHOLD}`
        : `Total prize value of $${taxData.totalPrizeValue.toFixed(2)} is below IRS reporting threshold`,
      totalPrizeValue: taxData.totalPrizeValue
    };
  }

  // Get tax reporting data for user and year
  async getTaxReportingData(userId: string, year: number): Promise<TaxReportingData> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // This would need to be implemented based on your prize/winner tracking system
    // For now, returning a placeholder structure
    const prizeDetails: TaxReportingData['prizeDetails'] = [];
    
    // Get W9 form if exists
    const userW9Forms = await db
      .select()
      .from(w9Forms)
      .where(and(eq(w9Forms.userId, userId), eq(w9Forms.status, 'approved')))
      .orderBy(desc(w9Forms.createdAt));

    const totalPrizeValue = prizeDetails.reduce((sum, prize) => sum + prize.prizeValue, 0);

    return {
      userId,
      year,
      totalPrizeValue,
      prizeDetails,
      w9FormId: userW9Forms[0]?.id,
      requires1099: totalPrizeValue >= this.MIN_REPORTING_THRESHOLD
    };
  }

  // Generate 1099 data for admin
  async generate1099Data(year: number): Promise<any[]> {
    // Get all users who need 1099s for the year
    const users1099Data: any[] = [];
    
    // This would query all users and check their prize totals
    // Implementation depends on your specific prize/winner tracking
    
    return users1099Data;
  }

  // Validate W9 form data
  private validateW9Form(formData: W9FormData): W9Validation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!formData.name?.trim()) {
      errors.push('Name is required');
    }

    if (!formData.address?.trim()) {
      errors.push('Address is required');
    }

    if (!formData.city?.trim()) {
      errors.push('City is required');
    }

    if (!formData.state?.trim()) {
      errors.push('State is required');
    }

    if (!formData.zipCode?.trim()) {
      errors.push('ZIP code is required');
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      errors.push('ZIP code must be in format 12345 or 12345-6789');
    }

    if (!formData.tin?.trim()) {
      errors.push('Taxpayer Identification Number is required');
    } else {
      // Validate TIN format
      const tin = formData.tin.replace(/\D/g, '');
      if (formData.tinType === 'ssn' && tin.length !== 9) {
        errors.push('SSN must be 9 digits');
      } else if (formData.tinType === 'ein' && tin.length !== 9) {
        errors.push('EIN must be 9 digits');
      }
    }

    if (!formData.isCertified) {
      errors.push('Form must be certified');
    }

    if (!formData.signatureName?.trim()) {
      errors.push('Signature name is required');
    }

    // Business type validation
    if (!formData.businessType) {
      errors.push('Business type is required');
    } else if (formData.businessType === 'other' && !formData.businessTypeOther?.trim()) {
      errors.push('Please specify other business type');
    }

    // Warnings
    if (formData.businessType === 'individual' && formData.businessName) {
      warnings.push('Business name is typically not needed for individual taxpayers');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Send W9 submission notification
  private async sendW9SubmissionNotification(userId: string, formId: string): Promise<void> {
    await emailService.sendNotification(userId, 'w9_submitted', {
      formId,
      message: 'Your W9 tax form has been successfully submitted and is under review.'
    });
  }

  // Send W9 review notification
  private async sendW9ReviewNotification(
    userId: string, 
    formId: string, 
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<void> {
    const emailType = action === 'approve' ? 'w9_approved' : 'w9_rejected';
    
    await emailService.sendNotification(userId, emailType, {
      formId,
      rejectionReason,
      message: action === 'approve' 
        ? 'Your W9 tax form has been approved and is now on file.'
        : 'Your W9 tax form requires revision before it can be approved.'
    });
  }

  // Check for expired forms (forms older than 3 years)
  async checkExpiredForms(): Promise<void> {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    await db
      .update(w9Forms)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(and(
        lte(w9Forms.certificationDate, threeYearsAgo),
        eq(w9Forms.status, 'approved')
      ));
  }

  // Admin: Get all W9 forms for review
  async getFormsForReview(status?: 'submitted' | 'approved' | 'rejected'): Promise<any[]> {
    const query = db
      .select({
        id: w9Forms.id,
        userId: w9Forms.userId,
        userName: users.name,
        userEmail: users.email,
        businessName: w9Forms.businessName,
        businessType: w9Forms.businessType,
        name: w9Forms.payeeName,
        status: w9Forms.status,
        submittedAt: w9Forms.submittedAt,
        reviewedAt: w9Forms.reviewedAt,
        createdAt: w9Forms.createdAt
      })
      .from(w9Forms)
      .leftJoin(users, eq(w9Forms.userId, users.id))
      .orderBy(desc(w9Forms.submittedAt));

    if (status) {
      return await query.where(eq(w9Forms.status, status));
    }

    return await query;
  }
}

// Export singleton instance
export const w9Service = new W9Service(); 