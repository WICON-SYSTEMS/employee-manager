import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/use-employees";
import { sendPayout, getPayoutEnvInfo, type PayoutMedium } from "@/lib/payments";
import { Download, Upload, Wallet, FileSpreadsheet, Shield } from "lucide-react";

export default function PaymentsPage() {
  const { toast } = useToast();
  const { employees, isLoading } = useEmployees();

  // Manual payout state
  const [employeeId, setEmployeeId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("XAF");
  const [medium, setMedium] = useState<PayoutMedium>("mobile money");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvDefaultMedium, setCsvDefaultMedium] = useState<PayoutMedium>("mobile money");
  const [csvInProgress, setCsvInProgress] = useState<{ total: number; done: number; success: number; failed: number } | null>(null);

  const sortedEmployees = useMemo(
    () => [...employees].sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)),
    [employees]
  );

  useEffect(() => {
    if (!employeeId && sortedEmployees.length > 0) {
      setEmployeeId(sortedEmployees[0].employee_id);
    }
  }, [sortedEmployees, employeeId]);

  const handleManualPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !amount) {
      toast({ title: "Missing fields", description: "Select an employee and enter an amount.", variant: "destructive" });
      return;
    }
    const emp = sortedEmployees.find(e => e.employee_id === employeeId);
    if (!emp) {
      toast({ title: "Employee not found", description: "Please select a valid employee.", variant: "destructive" });
      return;
    }
    const externalId = `pay_${Date.now()}_${emp.employee_id}`;
    const name = `${emp.first_name} ${emp.last_name}`;
    setIsSubmittingManual(true);
    sendPayout({
      amount: Number(amount),
      phone: emp.phone,
      medium,
      name,
      email: emp.email,
      userId: emp.employee_id,
      externalId,
      message: note || `Payout on ${date}`,
    })
      .then((resp) => {
        toast({ title: resp.status || "Payout sent", description: resp.message || `${currency} ${Number(amount).toLocaleString()} to ${name}` });
        setAmount("");
        setNote("");
      })
      .catch((err: any) => {
        toast({ title: "Payout failed", description: err?.message || "Could not send payout", variant: "destructive" });
      })
      .finally(() => setIsSubmittingManual(false));
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCsvFile(file);
    setCsvPreview([]);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        const rows = text.trim().split(/\r?\n/).map(line => line.split(",").map(c => c.trim()));
        setCsvPreview(rows.slice(0, 6)); // preview first 6 rows incl header
      };
      reader.readAsText(file);
    }
  };

  const handleCsvTemplate = () => {
    const header = ["employee_id", "amount", "currency", "date", "note"]; // YYYY-MM-DD
    const example = [
      ["emp_XXXX", "100000", "XAF", new Date().toISOString().slice(0, 10), "September salary"],
    ];
    const csv = [header, ...example].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = () => {
    if (!csvFile) {
      toast({ title: "No file selected", description: "Choose a CSV file to upload.", variant: "destructive" });
      return;
    }
    const rows = csvPreview.slice(1); // skip header
    if (rows.length === 0) {
      toast({ title: "Empty CSV", description: "No data rows found.", variant: "destructive" });
      return;
    }
    const mapById = new Map(sortedEmployees.map(e => [e.employee_id, e]));
    let done = 0, success = 0, failed = 0;
    setCsvInProgress({ total: rows.length, done, success, failed });
    const processNext = async (index: number) => {
      if (index >= rows.length) {
        toast({ title: "CSV processed", description: `Success: ${success}, Failed: ${failed}` });
        setCsvInProgress(null);
        setCsvFile(null);
        setCsvPreview([]);
        return;
      }
      const [empId, amtStr, cur, d, noteStr] = rows[index];
      const emp = empId ? mapById.get(empId) : undefined;
      if (!emp) {
        failed++; done++;
        setCsvInProgress({ total: rows.length, done, success, failed });
        return processNext(index + 1);
      }
      const name = `${emp.first_name} ${emp.last_name}`;
      const externalId = `pay_${Date.now()}_${emp.employee_id}_${index}`;
      try {
        await sendPayout({
          amount: Number(amtStr),
          phone: emp.phone,
          medium: csvDefaultMedium,
          name,
          email: emp.email,
          userId: emp.employee_id,
          externalId,
          message: noteStr || `Payout on ${d || date}`,
        });
        success++; done++;
      } catch (e: any) {
        failed++; done++;
      }
      setCsvInProgress({ total: rows.length, done, success, failed });
      processNext(index + 1);
    };
    processNext(0);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground mt-2">Create payouts to employees manually or via CSV upload.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleCsvTemplate}>
              <Download className="w-4 h-4" /> Download CSV Template
            </Button>
          </div>
        </div>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList>
            <TabsTrigger value="manual" className="gap-2">
              <Wallet className="w-4 h-4" /> Manual Payout
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" /> CSV Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Manual Payout</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualPayout} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Employee</Label>
                    <Select value={employeeId} onValueChange={setEmployeeId} disabled={isLoading || sortedEmployees.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoading ? "Loading..." : "Select employee"} />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedEmployees.map((e) => (
                          <SelectItem key={e.employee_id} value={e.employee_id}>
                            {e.first_name} {e.last_name} ({e.employee_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currency}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-16"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Medium</Label>
                    <Select value={medium} onValueChange={(v) => setMedium(v as PayoutMedium)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select medium" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile money">Mobile Money</SelectItem>
                        <SelectItem value="orange money">Orange Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XAF">XAF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Note</Label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for this payout" />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" className="gap-2" disabled={isSubmittingManual}>
                      {isSubmittingManual ? "Sending..." : "Create Payout"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="csv">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>CSV Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3">
                  <input
                    id="payments-csv"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleCsvChange}
                  />
                  <Label htmlFor="payments-csv">
                    <Button variant="outline" type="button" className="gap-2">
                      <Upload className="w-4 h-4" /> Choose CSV
                    </Button>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Label>Default Medium</Label>
                    <Select value={csvDefaultMedium} onValueChange={(v) => setCsvDefaultMedium(v as PayoutMedium)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Medium" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile money">Mobile Money</SelectItem>
                        <SelectItem value="orange money">Orange Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCsvUpload} disabled={!csvFile} className="gap-2">
                    Upload & Queue
                  </Button>
                </div>
                {csvFile && (
                  <p className="text-xs text-muted-foreground">Selected: {csvFile.name}</p>
                )}
                {csvInProgress && (
                  <div className="text-sm text-muted-foreground">
                    Processing {csvInProgress.done}/{csvInProgress.total} • Success: {csvInProgress.success} • Failed: {csvInProgress.failed}
                    <div className="w-full h-2 bg-muted rounded mt-2 overflow-hidden">
                      <div className="h-2 bg-primary" style={{ width: `${(csvInProgress.done / csvInProgress.total) * 100}%` }}></div>
                    </div>
                  </div>
                )}
                {csvPreview.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          {csvPreview[0].map((h, i) => (
                            <th key={i} className="text-left p-3 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(1).map((row, idx) => (
                          <tr key={idx} className="border-b last:border-b-0">
                            {row.map((cell, ci) => (
                              <td key={ci} className="p-3">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvPreview.length === 1 && (
                      <p className="text-xs text-muted-foreground mt-2">No data rows found in the CSV.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
