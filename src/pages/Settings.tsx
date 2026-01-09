import { useState, useEffect } from "react";
import { usePousadas } from "@/hooks/usePousadas";
import { useKitchenSound } from "@/hooks/useKitchenSound";
import { toast } from "sonner";
import {
  Loader2,
  Store,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  Volume2,
  Bell,
  Save,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import print logic if available, or just mock/comment it out if the file was deleted?
// The previous file had import("@/utils/printUtils")... inline.
// Assuming the interface for PrinterSettings

interface PrinterSettings {
  paperWidth: "58mm" | "80mm";
  fontSize: "small" | "normal" | "large";
  autoPrint: boolean;
}

import { BannerManager } from "@/components/admin/BannerManager";

export default function Settings() {
  const { soundEnabled, setSoundEnabled } = useKitchenSound();
  const { pousadas, isLoading, updatePousada } = usePousadas();

  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    paperWidth: "80mm",
    fontSize: "normal",
    autoPrint: false,
  });

  // Verify printer settings on load
  useEffect(() => {
    const saved = localStorage.getItem("printer_settings");
    if (saved) {
      try {
        setPrinterSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing printer settings", e);
      }
    }
  }, []);

  const handleSavePrinter = () => {
    localStorage.setItem("printer_settings", JSON.stringify(printerSettings));
    toast.success("Configurações de impressão salvas neste dispositivo!");
  };

  const currentStore = pousadas.find((p) => p.is_hq) || pousadas[0];

  const [formData, setFormData] = useState({
    is_open: true,
    opening_hours: "",
    pix_key: "",
    pix_key_type: "cpf",
    estimated_time_min: 30,
    estimated_time_max: 45,
    accepted_payment_methods: ["pix", "card", "cash"],
  });

  useEffect(() => {
    if (currentStore) {
      setFormData({
        is_open: currentStore.is_open ?? true,
        opening_hours: currentStore.opening_hours ?? "18:00 - 23:00",
        pix_key: currentStore.pix_key ?? "",
        pix_key_type: currentStore.pix_key_type ?? "cpf",
        estimated_time_min: currentStore.estimated_time_min ?? 30,
        estimated_time_max: currentStore.estimated_time_max ?? 45,
        accepted_payment_methods: currentStore.accepted_payment_methods ?? [
          "pix",
          "card",
          "cash",
        ],
      });
    }
  }, [currentStore]);

  const handleSaveStore = async () => {
    if (!currentStore) return;
    try {
      await updatePousada.mutateAsync({
        id: currentStore.id,
        ...formData,
      });
      // Success toast is handled by query mutation logic typically, 
      // but if not, usePousadas logic has success toast.
    } catch (e) {
      // Error toast handled by mutation logic
    }
  };

  const togglePaymentMethod = (method: string) => {
    setFormData((prev) => {
      const current = prev.accepted_payment_methods || [];
      if (current.includes(method)) {
        return {
          ...prev,
          accepted_payment_methods: current.filter((m) => m !== method),
        };
      } else {
        return { ...prev, accepted_payment_methods: [...current, method] };
      }
    });
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie status da loja, pagamentos e impressoras.
        </p>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
          <TabsTrigger value="store">Loja & Horários</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="printer">Impressão</TabsTrigger>
          <TabsTrigger value="sound">Sons</TabsTrigger>
        </TabsList>

        {/* --- STORE TAB --- */}
        <TabsContent value="store" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" /> Status da Loja
              </CardTitle>
              <CardDescription>
                Defina se a loja está aceitando pedidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div className="space-y-0.5">
                  <Label className="text-base">Loja Aberta</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_open
                      ? "Aceitando pedidos normalmente."
                      : "Loja fechada. Nenhum pedido será aceito."}
                  </p>
                </div>
                <Switch
                  checked={formData.is_open}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, is_open: c })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Horário de Funcionamento</Label>
                  <Input
                    value={formData.opening_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        opening_hours: e.target.value,
                      })
                    }
                    placeholder="Ex: 18:00 às 23:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tempo Estimado (Min - Máx)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={formData.estimated_time_min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimated_time_min: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      value={formData.estimated_time_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimated_time_max: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-muted-foreground">min</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSaveStore}
                disabled={updatePousada.isPending}
                className="w-full md:w-auto gap-2"
              >
                <Save className="h-4 w-4" /> Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- PAYMENT TAB --- */}
        <TabsContent value="payments" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base">Métodos Aceitos</Label>
                <div className="flex gap-4 flex-wrap">
                  <div
                    onClick={() => togglePaymentMethod("pix")}
                    className={`cursor-pointer border p-4 rounded-xl flex items-center gap-2 transition-colors ${formData.accepted_payment_methods.includes("pix")
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-gray-50 opacity-50"
                      }`}
                  >
                    <QrCode className="h-5 w-5" /> Pix
                  </div>
                  <div
                    onClick={() => togglePaymentMethod("card")}
                    className={`cursor-pointer border p-4 rounded-xl flex items-center gap-2 transition-colors ${formData.accepted_payment_methods.includes("card")
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-gray-50 opacity-50"
                      }`}
                  >
                    <CreditCard className="h-5 w-5" /> Cartão
                  </div>
                  <div
                    onClick={() => togglePaymentMethod("cash")}
                    className={`cursor-pointer border p-4 rounded-xl flex items-center gap-2 transition-colors ${formData.accepted_payment_methods.includes("cash")
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-gray-50 opacity-50"
                      }`}
                  >
                    <Banknote className="h-5 w-5" /> Dinheiro
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Chave Pix</Label>
                <div className="flex gap-4">
                  <Select
                    value={formData.pix_key_type}
                    onValueChange={(v) =>
                      setFormData({ ...formData, pix_key_type: v })
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Celular</SelectItem>
                      <SelectItem value="random">Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={formData.pix_key}
                    onChange={(e) =>
                      setFormData({ ...formData, pix_key: e.target.value })
                    }
                    placeholder="Digite a chave pix..."
                    className="flex-1"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveStore}
                disabled={updatePousada.isPending}
                className="w-full md:w-auto gap-2"
              >
                <Save className="h-4 w-4" /> Salvar Pagamentos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- BANNERS TAB --- */}
        <TabsContent value="banners" className="space-y-4 mt-6">
          <BannerManager />
        </TabsContent>

        {/* --- PRINTER TAB --- */}
        <TabsContent value="printer" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Configuração de Impressora Térmica
              </CardTitle>
              <CardDescription>
                Ajuste o formato do cupom para sua impressora (58mm ou 80mm). As
                configurações são salvas{" "}
                <strong>apenas neste computador/tablet</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Largura do Papel</Label>
                  <Select
                    value={printerSettings.paperWidth}
                    onValueChange={(val: any) =>
                      setPrinterSettings({ ...printerSettings, paperWidth: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm (Pequena)</SelectItem>
                      <SelectItem value="80mm">80mm (Padrão)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tamanho da Fonte</Label>
                  <Select
                    value={printerSettings.fontSize}
                    onValueChange={(val: any) =>
                      setPrinterSettings({ ...printerSettings, fontSize: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequena (Compacta)</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="large">Grande (Cozinha)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Impressão Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Abrir janela de impressão automaticamente ao aceitar um
                    pedido.
                  </p>
                </div>
                <Switch
                  checked={printerSettings.autoPrint}
                  onCheckedChange={(checked) =>
                    setPrinterSettings({ ...printerSettings, autoPrint: checked })
                  }
                />
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    import("@/utils/printUtils").then((mod) =>
                      mod.printTestReceipt(printerSettings)
                    );
                  }}
                >
                  Testar Impressão
                </Button>
                <Button onClick={handleSavePrinter} className="gap-2">
                  <Save className="h-4 w-4" /> Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SOUND TAB --- */}
        <TabsContent value="sound" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Alertas Sonoros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-slate-50">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" /> Alarme de Cozinha
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tocar som contínuo quando houver pedidos pendentes.
                  </p>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
