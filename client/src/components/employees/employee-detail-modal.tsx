import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, IdCard, DollarSign, Download, Edit, Upload } from "lucide-react";
import { getEmployee, normalizeQrImage } from "@/lib/employees";
import type { Employee } from "@shared/schema";
import { useEmployees } from "@/hooks/use-employees";
import { useToast } from "@/hooks/use-toast";

interface EmployeeDetailModalProps {
  open: boolean;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
  employee: Employee | null;
}

export function EmployeeDetailModal({ open, onClose, onEdit, employee }: EmployeeDetailModalProps) {
  // Backend-generated QR image string (URL or base64) after upload
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [details, setDetails] = useState<Employee | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const { uploadBiometrics, isUploadingBiometrics, uploadError } = useEmployees();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showQrLightbox, setShowQrLightbox] = useState(false);

  // Clear any previous upload state when reopening
  useEffect(() => {
    if (open) {
      setUploadFile(null);
      setQrImage(null);
    }
  }, [open]);

  // Fetch full employee details (includes salary) when modal opens
  useEffect(() => {
    const fetchDetails = async () => {
      if (!open || !employee?.employee_id) return;
      try {
        setLoadingDetails(true);
        const full = await getEmployee(employee.employee_id);
        setDetails(full);
      } catch (e) {
        // fail silently; UI will fallback to list data
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [open, employee?.employee_id]);

  if (!employee) return null;

  const salaryVal = (details?.salary ?? employee.salary) as unknown;
  const salaryNumber = typeof salaryVal === 'number' ? salaryVal : undefined;

  // Derive biometric status safely
  const faceRegistered =
    details?.biometric_status?.facial_biometrics_registered ?? undefined;
  const qrGenerated =
    details?.biometric_status?.qr_code_generated ??
    (employee.registration_status === 'fully_registered' ? true : undefined);

  // Normalize QR image from details (GET by ID) or fallback to list item if present
  const qrFromDetails = normalizeQrImage(
    // Preferred: nested info object
    (details as any)?.qr_code_info?.qr_code_image ||
    (details as any)?.qr_code_info?.image ||
    (details as any)?.qr_code_info?.qr ||
    // Flat fields on details
    (details as any)?.qr_code_image ||
    (details as any)?.qr_code ||
    (details as any)?.qr_code_image_url ||
    // Fallback to the employee object passed from the table/list
    (employee as any)?.qr_code_info?.qr_code_image ||
    (employee as any)?.qr_code_image ||
    (employee as any)?.qr_code ||
    (employee as any)?.qr_code_image_url ||
    null
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const handleDownloadQR = () => {
    const src = qrImage || qrFromDetails;
    if (!src) return;
    // Create a temporary link to download the QR image
    const link = document.createElement('a');
    link.href = src;
    link.download = `employee-${employee.employee_id}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB", variant: "destructive" });
      return;
    }
    setUploadFile(file);
  };

  const handleUploadBiometrics = () => {
    if (!uploadFile || !employee?.employee_id) {
      toast({ title: "Select a photo", description: "Choose an image to upload.", variant: "destructive" });
      return;
    }
    uploadBiometrics(
      { employeeId: employee.employee_id, file: uploadFile },
      {
        onSuccess: async (resp) => {
          // resp contains { data, message }
          setQrImage(normalizeQrImage(resp.data.qr_code_image));
          // Optimistically reflect status
          setDetails((prev) => prev ? {
            ...prev,
            biometric_status: {
              fingerprint_registered: prev.biometric_status?.fingerprint_registered ?? false,
              facial_biometrics_registered: true,
              qr_code_generated: true,
            }
          } : prev);
          toast({ title: "Success", description: resp.message || "QR code generated successfully." });
          // refetch details to update biometric_status
          try {
            const refreshed = await getEmployee(employee.employee_id);
            setDetails(refreshed);
          } catch {}
        },
        onError: (err: any) => {
          toast({ title: "Upload failed", description: err?.message || "Could not upload biometrics", variant: "destructive" });
        },
      }
    );
  };

  const handleEdit = () => {
    onEdit(employee);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="modal-title-detail">Employee Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Header */}
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src="" alt={`${employee.first_name} ${employee.last_name}`} />
              <AvatarFallback className="bg-muted text-2xl">
                {getInitials(employee.first_name, employee.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-foreground" data-testid="text-employee-name">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-lg text-muted-foreground" data-testid="text-employee-position">
                {employee.position}
              </p>
              <p className="text-muted-foreground" data-testid="text-employee-department">
                {employee.department}
              </p>
              <div className="mt-3">
                <Badge 
                  variant={employee.status === 'active' ? 'default' : 'secondary'}
                  data-testid="badge-employee-status"
                >
                  {employee.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground" data-testid="text-employee-email">
                    {employee.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground" data-testid="text-employee-phone">
                    {employee.phone}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">Employment Details</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    ID: <span data-testid="text-employee-id">{employee.employee_code}</span>
                  </span>
                </div>
                {typeof salaryNumber === 'number' && (
                  <div className="flex items-center gap-3">
                   Salary:
                    <span className="text-foreground" data-testid="text-employee-salary">
                      {`XAF ${salaryNumber.toLocaleString()}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Biometrics & QR Section */}
          <div className="bg-muted p-6 rounded-lg space-y-4">
            <h4 className="font-medium text-foreground">Facial Biometrics & QR</h4>
            <p className="text-sm text-muted-foreground">
              Upload an employee facial photo to generate a QR code from the backend.
            </p>

            {/* Status */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={(faceRegistered ? 'default' : 'secondary') as any}>
                {loadingDetails && faceRegistered === undefined ? 'Face: Loading…' : `Face: ${faceRegistered ? 'Registered' : 'Not registered'}`}
              </Badge>
              <Badge variant={(qrGenerated ? 'default' : 'secondary') as any}>
                {loadingDetails && qrGenerated === undefined ? 'QR: Loading…' : `QR: ${qrGenerated ? 'Generated' : 'Not generated'}`}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="bg-white p-4 rounded-lg" data-testid="qr-code-container">
                {qrImage || qrFromDetails ? (
                  <img src={(qrImage || qrFromDetails) as string} alt="QR Code" className="w-32 h-32 object-contain" />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">No QR yet</p>
                      <p className="text-[10px] text-gray-500">Upload a photo to generate</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    id="biometric-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSelectFile}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" /> Choose Photo
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUploadBiometrics}
                    disabled={isUploadingBiometrics}
                    className="gap-2"
                  >
                    {isUploadingBiometrics ? 'Uploading...' : 'Upload & Generate QR'}
                  </Button>
                </div>
                {uploadFile && (
                  <p className="text-xs text-muted-foreground mt-1">Selected: {uploadFile.name}</p>
                )}
                <div className="mt-4 space-y-2">
                  <Button onClick={handleDownloadQR} disabled={!qrImage && !qrFromDetails} data-testid="button-download-qr">
                    <Download className="h-4 w-4 mr-2" /> Download QR Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowQrLightbox(true)}
                    disabled={!qrImage && !qrFromDetails}
                    data-testid="button-view-qr"
                  >
                    View Full-size QR
                  </Button>
                  {(details?.qr_code_info?.expires_at || details?.qr_code_expires_at) && (
                    <p className="text-xs text-muted-foreground">Expires: {new Date((details?.qr_code_info?.expires_at || details?.qr_code_expires_at) as string).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* QR Lightbox */}
            <Dialog open={showQrLightbox} onOpenChange={setShowQrLightbox}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>QR Code</DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center p-2">
                  {(qrImage || qrFromDetails) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(qrImage || qrFromDetails) as string}
                      alt="QR Code Full"
                      className="w-72 h-72"
                      data-testid="image-qr-full"
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleEdit}
              data-testid="button-edit-employee"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Employee
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              data-testid="button-close-detail"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
