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
import { Download, Upload, Wallet, FileSpreadsheet } from "lucide-react";

export default function PaymentsPage() {
  const { toast } = useToast();
  const { employees, isLoading } = useEmployees();

  // Manual payout state
  const [employeeId, setEmployeeId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("XAF");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);

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
    // Placeholder action (no backend yet) – just toast success
    toast({
      title: "Payout created",
      description: `Scheduled ${currency} ${Number(amount).toLocaleString()} to employee`,
    });
    // Reset some fields
    setAmount("");
    setNote("");
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
    // Placeholder action – show success toast
    toast({ title: "CSV received", description: `Queued ${csvPreview.length > 0 ? csvPreview.length - 1 : 0} payouts for processing.` });
    setCsvFile(null);
    setCsvPreview([]);
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
                    <Button type="submit" className="gap-2">
                      Create Payout
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
                  <Button onClick={handleCsvUpload} disabled={!csvFile} className="gap-2">
                    Upload & Queue
                  </Button>
                </div>
                {csvFile && (
                  <p className="text-xs text-muted-foreground">Selected: {csvFile.name}</p>
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
