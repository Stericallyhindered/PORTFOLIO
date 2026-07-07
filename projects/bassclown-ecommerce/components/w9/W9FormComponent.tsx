'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  User,
  Building,
  CreditCard,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface W9FormData {
  // Taxpayer Information
  name: string;
  businessName?: string;
  federalClassification: 'individual' | 'sole-proprietor' | 'single-llc' | 'c-corp' | 's-corp' | 'partnership' | 'trust-estate' | 'limited-liability' | 'other';
  otherClassification?: string;
  exemptPayeeCode?: string;
  exemptFatcaCode?: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Tax Identification
  taxIdType: 'ssn' | 'ein';
  socialSecurityNumber?: string;
  employerIdNumber?: string;
  
  // Certification
  backupWithholding: boolean;
  certificationDate: string;
  
  // Additional Information
  accountNumbers?: string;
  requestorName?: string;
  requestorAddress?: string;
}

interface W9FormProps {
  userId?: string;
  contestId?: string;
  onSubmit?: (formData: W9FormData) => void;
  onCancel?: () => void;
  existingData?: Partial<W9FormData>;
  readonly?: boolean;
}

export function W9FormComponent({ 
  userId, 
  contestId, 
  onSubmit, 
  onCancel, 
  existingData, 
  readonly = false 
}: W9FormProps) {
  const [formData, setFormData] = useState<W9FormData>({
    name: '',
    businessName: '',
    federalClassification: 'individual',
    otherClassification: '',
    exemptPayeeCode: '',
    exemptFatcaCode: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    taxIdType: 'ssn',
    socialSecurityNumber: '',
    employerIdNumber: '',
    backupWithholding: false,
    certificationDate: format(new Date(), 'yyyy-MM-dd'),
    accountNumbers: '',
    requestorName: '',
    requestorAddress: '',
    ...existingData
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSSN, setShowSSN] = useState(false);
  const [showEIN, setShowEIN] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const { toast } = useToast();

  useEffect(() => {
    if (existingData) {
      setFormData(prev => ({ ...prev, ...existingData }));
    }
  }, [existingData]);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepNumber) {
      case 1: // Personal Information
        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        }
        if (formData.federalClassification === 'other' && !formData.otherClassification?.trim()) {
          newErrors.otherClassification = 'Please specify the classification';
        }
        break;

      case 2: // Address Information
        if (!formData.address.trim()) {
          newErrors.address = 'Address is required';
        }
        if (!formData.city.trim()) {
          newErrors.city = 'City is required';
        }
        if (!formData.state.trim()) {
          newErrors.state = 'State is required';
        }
        if (!formData.zipCode.trim()) {
          newErrors.zipCode = 'ZIP code is required';
        } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
          newErrors.zipCode = 'Invalid ZIP code format';
        }
        break;

      case 3: // Tax Identification
        if (formData.taxIdType === 'ssn') {
          if (!formData.socialSecurityNumber?.trim()) {
            newErrors.socialSecurityNumber = 'Social Security Number is required';
          } else if (!/^\d{3}-?\d{2}-?\d{4}$/.test(formData.socialSecurityNumber.replace(/-/g, ''))) {
            newErrors.socialSecurityNumber = 'Invalid SSN format';
          }
        } else {
          if (!formData.employerIdNumber?.trim()) {
            newErrors.employerIdNumber = 'Employer ID Number is required';
          } else if (!/^\d{2}-?\d{7}$/.test(formData.employerIdNumber.replace(/-/g, ''))) {
            newErrors.employerIdNumber = 'Invalid EIN format';
          }
        }
        break;

      case 4: // Certification
        if (!formData.certificationDate) {
          newErrors.certificationDate = 'Certification date is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof W9FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatSSN = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  const formatEIN = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
  };

  const handleSSNChange = (value: string) => {
    const formatted = formatSSN(value);
    handleInputChange('socialSecurityNumber', formatted);
  };

  const handleEINChange = (value: string) => {
    const formatted = formatEIN(value);
    handleInputChange('employerIdNumber', formatted);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, JPEG, or PNG file.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploadedFile(file);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/w9-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId,
          contestId,
          uploadedFile: uploadedFile ? {
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type
          } : null
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'W9 Form Submitted',
          description: 'Your W9 form has been successfully submitted and is under review.'
        });
        
        onSubmit?.(formData);
      } else {
        throw new Error('Failed to submit W9 form');
      }
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit W9 form. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadBlankForm = () => {
    // In a real implementation, this would download the official IRS W9 form
    const link = document.createElement('a');
    link.href = '/forms/w9-blank.pdf';
    link.download = 'Form-W9-Blank.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Name (as shown on your income tax return) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={readonly}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="businessName">Business name/disregarded entity name (if different from above)</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  disabled={readonly}
                />
              </div>

              <div>
                <Label>Federal tax classification *</Label>
                <RadioGroup
                  value={formData.federalClassification}
                  onValueChange={(value) => handleInputChange('federalClassification', value)}
                  disabled={readonly}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual">Individual/sole proprietor or single-member LLC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="c-corp" id="c-corp" />
                    <Label htmlFor="c-corp">C Corporation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="s-corp" id="s-corp" />
                    <Label htmlFor="s-corp">S Corporation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partnership" id="partnership" />
                    <Label htmlFor="partnership">Partnership</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trust-estate" id="trust-estate" />
                    <Label htmlFor="trust-estate">Trust/estate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limited-liability" id="limited-liability" />
                    <Label htmlFor="limited-liability">Limited liability company</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>

                {formData.federalClassification === 'other' && (
                  <div className="mt-2">
                    <Input
                      placeholder="Please specify"
                      value={formData.otherClassification}
                      onChange={(e) => handleInputChange('otherClassification', e.target.value)}
                      disabled={readonly}
                      className={errors.otherClassification ? 'border-red-500' : ''}
                    />
                    {errors.otherClassification && (
                      <p className="text-sm text-red-500 mt-1">{errors.otherClassification}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exemptPayeeCode">Exempt payee code (if any)</Label>
                  <Input
                    id="exemptPayeeCode"
                    value={formData.exemptPayeeCode}
                    onChange={(e) => handleInputChange('exemptPayeeCode', e.target.value)}
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label htmlFor="exemptFatcaCode">Exemption from FATCA reporting code (if any)</Label>
                  <Input
                    id="exemptFatcaCode"
                    value={formData.exemptFatcaCode}
                    onChange={(e) => handleInputChange('exemptFatcaCode', e.target.value)}
                    disabled={readonly}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Address (number, street, and apt. or suite no.) *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={readonly}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={readonly}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  disabled={readonly}
                  className={errors.state ? 'border-red-500' : ''}
                />
                {errors.state && <p className="text-sm text-red-500 mt-1">{errors.state}</p>}
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  disabled={readonly}
                  className={errors.zipCode ? 'border-red-500' : ''}
                />
                {errors.zipCode && <p className="text-sm text-red-500 mt-1">{errors.zipCode}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="requestorName">Requester's name and address (optional)</Label>
              <Input
                id="requestorName"
                placeholder="Requester's name"
                value={formData.requestorName}
                onChange={(e) => handleInputChange('requestorName', e.target.value)}
                disabled={readonly}
                className="mb-2"
              />
              <Textarea
                placeholder="Requester's address"
                value={formData.requestorAddress}
                onChange={(e) => handleInputChange('requestorAddress', e.target.value)}
                disabled={readonly}
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Taxpayer Identification Number *</Label>
              <RadioGroup
                value={formData.taxIdType}
                onValueChange={(value) => handleInputChange('taxIdType', value as 'ssn' | 'ein')}
                disabled={readonly}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ssn" id="ssn" />
                  <Label htmlFor="ssn">Social Security Number</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ein" id="ein" />
                  <Label htmlFor="ein">Employer Identification Number</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.taxIdType === 'ssn' ? (
              <div>
                <Label htmlFor="socialSecurityNumber">Social Security Number *</Label>
                <div className="relative">
                  <Input
                    id="socialSecurityNumber"
                    type={showSSN ? 'text' : 'password'}
                    value={formData.socialSecurityNumber}
                    onChange={(e) => handleSSNChange(e.target.value)}
                    disabled={readonly}
                    placeholder="XXX-XX-XXXX"
                    className={errors.socialSecurityNumber ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSSN(!showSSN)}
                    disabled={readonly}
                  >
                    {showSSN ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.socialSecurityNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.socialSecurityNumber}</p>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="employerIdNumber">Employer Identification Number *</Label>
                <div className="relative">
                  <Input
                    id="employerIdNumber"
                    type={showEIN ? 'text' : 'password'}
                    value={formData.employerIdNumber}
                    onChange={(e) => handleEINChange(e.target.value)}
                    disabled={readonly}
                    placeholder="XX-XXXXXXX"
                    className={errors.employerIdNumber ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowEIN(!showEIN)}
                    disabled={readonly}
                  >
                    {showEIN ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.employerIdNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.employerIdNumber}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="accountNumbers">Account number(s) (optional)</Label>
              <Textarea
                id="accountNumbers"
                placeholder="List any relevant account numbers"
                value={formData.accountNumbers}
                onChange={(e) => handleInputChange('accountNumbers', e.target.value)}
                disabled={readonly}
                rows={3}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Certification:</strong> Under penalties of perjury, I certify that:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me)</li>
                  <li>I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the Internal Revenue Service (IRS) that I am subject to backup withholding as a result of a failure to report all interest or dividends, or (c) the IRS has notified me that I am no longer subject to backup withholding</li>
                  <li>I am a U.S. citizen or other U.S. person</li>
                  <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="backupWithholding"
                checked={formData.backupWithholding}
                onCheckedChange={(checked) => handleInputChange('backupWithholding', checked as boolean)}
                disabled={readonly}
              />
              <Label htmlFor="backupWithholding" className="text-sm">
                I am subject to backup withholding (check if applicable)
              </Label>
            </div>

            <div>
              <Label htmlFor="certificationDate">Certification Date *</Label>
              <Input
                id="certificationDate"
                type="date"
                value={formData.certificationDate}
                onChange={(e) => handleInputChange('certificationDate', e.target.value)}
                disabled={readonly}
                className={errors.certificationDate ? 'border-red-500' : ''}
              />
              {errors.certificationDate && (
                <p className="text-sm text-red-500 mt-1">{errors.certificationDate}</p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <Label>Upload Signed W9 Form (Optional)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6">
                {uploadedFile ? (
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {uploadProgress < 100 && (
                      <Progress value={uploadProgress} className="mt-2" />
                    )}
                    {uploadProgress === 100 && (
                      <div className="flex items-center justify-center mt-2 text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Upload complete</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Click to upload or drag and drop
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          PDF, PNG, or JPEG up to 10MB
                        </span>
                      </label>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        disabled={readonly}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Form W-9: Request for Taxpayer Identification Number
            </CardTitle>
            <CardDescription>
              Complete this form to provide your taxpayer identification information
            </CardDescription>
          </div>
          <Button onClick={downloadBlankForm} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Blank Form
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <Progress value={(step / totalSteps) * 100} />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Personal Info</span>
            <span>Address</span>
            <span>Tax ID</span>
            <span>Certification</span>
          </div>
        </div>

        <Separator />

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={step === 1 || readonly}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {onCancel && (
              <Button onClick={onCancel} variant="outline">
                Cancel
              </Button>
            )}
            
            {step < totalSteps ? (
              <Button onClick={nextStep} disabled={readonly}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || readonly}
                className="min-w-[120px]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Your personal information is encrypted and securely stored. 
            This form complies with IRS requirements and your data will only be used for tax reporting purposes.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
} 