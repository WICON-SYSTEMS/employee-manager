import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, IdCard, DollarSign, Download, Edit } from "lucide-react";
import { generateQRCodeDataURL, downloadQRCode } from "@/lib/qr-code";
import type { Employee } from "@shared/schema";

interface EmployeeDetailModalProps {
  open: boolean;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
  employee: Employee | null;
}

export function EmployeeDetailModal({ open, onClose, onEdit, employee }: EmployeeDetailModalProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");

  useEffect(() => {
    if (employee && open) {
      generateQRCodeDataURL(employee.id).then(setQrCodeDataURL);
    }
  }, [employee, open]);

  if (!employee) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleDownloadQR = () => {
    if (qrCodeDataURL) {
      downloadQRCode(qrCodeDataURL, `employee-${employee.id}-qr.png`);
    }
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
              <AvatarImage src={employee.photo || ""} alt={employee.name} />
              <AvatarFallback className="bg-muted text-2xl">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-foreground" data-testid="text-employee-name">
                {employee.name}
              </h3>
              <p className="text-lg text-muted-foreground" data-testid="text-employee-position">
                {employee.position}
              </p>
              <p className="text-muted-foreground" data-testid="text-employee-department">
                {employee.department}
              </p>
              <div className="mt-3">
                <Badge 
                  variant={employee.status === 'Active' ? 'default' : 'secondary'}
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
                    ID: <span data-testid="text-employee-id">{employee.id}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground" data-testid="text-employee-salary">
                    ${employee.salary.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-muted p-6 rounded-lg">
            <h4 className="font-medium text-foreground mb-4">Employee QR Code</h4>
            <div className="flex items-center gap-6">
              <div className="bg-white p-4 rounded-lg" data-testid="qr-code-container">
                {qrCodeDataURL ? (
                  <img 
                    src={qrCodeDataURL} 
                    alt={`QR Code for ${employee.name}`}
                    className="w-32 h-32"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs text-gray-500">Generating...</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  This QR code contains the employee's unique ID and can be used for attendance tracking.
                </p>
                <Button
                  onClick={handleDownloadQR}
                  disabled={!qrCodeDataURL}
                  data-testid="button-download-qr"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </div>
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
