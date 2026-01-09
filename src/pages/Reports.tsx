import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart3,
  Download,
  CalendarIcon,
  TrendingUp,
  Package,
  Clock,
  AlertTriangle
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ReportData {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  averagePrepTime: number;
  delayedOrders: number;
  ordersByType: { name: string; value: number }[];
  ordersByPayment: { name: string; value: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  salesByDay: { date: string; total: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom">("month");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  useEffect(() => {
    updateDateRange(dateRange);
  }, [dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, orderTypeFilter]);

  const updateDateRange = (range: "today" | "week" | "month" | "custom") => {
    const today = new Date();
    switch (range) {
      case "today":
        setStartDate(startOfDay(today));
        setEndDate(endOfDay(today));
        break;
      case "week":
        setStartDate(startOfWeek(today, { locale: ptBR }));
        setEndDate(endOfWeek(today, { locale: ptBR }));
        break;
      case "month":
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
    }
  };

  const fetchReportData = async () => {
    setLoading(true);

    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .neq("status", "cancelled");

    if (orderTypeFilter !== "all") {
      query = query.eq("order_type", orderTypeFilter as "delivery" | "counter" | "room");
    }

    const { data: orders } = await query;

    if (!orders) {
      setLoading(false);
      return;
    }

    // Calculate metrics
    const totalSales = orders.reduce((acc, o) => acc + Number(o.total), 0);
    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate average prep time and delayed orders
    const completedOrders = orders.filter((o) => o.started_at && o.completed_at);
    let totalPrepTime = 0;
    let delayedOrders = 0;

    completedOrders.forEach((order) => {
      const prepTime = (new Date(order.completed_at!).getTime() - new Date(order.started_at!).getTime()) / 60000;
      totalPrepTime += prepTime;
      if (prepTime > 15) delayedOrders++;
    });

    const averagePrepTime = completedOrders.length > 0 ? totalPrepTime / completedOrders.length : 0;

    // Orders by type
    const ordersByType = [
      { name: "Balcão", value: orders.filter((o) => o.order_type === "counter").length },
      { name: "Delivery", value: orders.filter((o) => o.order_type === "delivery").length },
      { name: "Quarto", value: orders.filter((o) => o.order_type === "room").length },
    ];

    // Orders by payment
    const ordersByPayment = [
      { name: "Dinheiro", value: orders.filter((o) => o.payment_method === "cash").length },
      { name: "Cartão", value: orders.filter((o) => o.payment_method === "card").length },
      { name: "Pix", value: orders.filter((o) => o.payment_method === "pix").length },
    ];

    // Top products
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    orders.forEach((order) => {
      order.order_items?.forEach((item: any) => {
        const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
        productMap.set(item.product_name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.quantity * Number(item.unit_price),
        });
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Sales by day
    const salesMap = new Map<string, number>();
    orders.forEach((order) => {
      const day = format(new Date(order.created_at), "dd/MM");
      salesMap.set(day, (salesMap.get(day) || 0) + Number(order.total));
    });

    const salesByDay = Array.from(salesMap.entries())
      .map(([date, total]) => ({ date, total }))
      .slice(-7);

    setData({
      totalSales,
      totalOrders,
      averageTicket,
      averagePrepTime,
      delayedOrders,
      ordersByType,
      ordersByPayment,
      topProducts,
      salesByDay,
    });

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const exportToCsv = () => {
    if (!data) return;

    const csvContent = [
      ["Relatório de Vendas"],
      [`Período: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`],
      [],
      ["Resumo"],
      ["Total Vendido", formatCurrency(data.totalSales)],
      ["Quantidade de Pedidos", data.totalOrders],
      ["Ticket Médio", formatCurrency(data.averageTicket)],
      ["Tempo Médio de Preparo", `${Math.round(data.averagePrepTime)} min`],
      ["Pedidos Atrasados", data.delayedOrders],
      [],
      ["Top Produtos"],
      ["Produto", "Quantidade", "Receita"],
      ...data.topProducts.map((p) => [p.name, p.quantity, formatCurrency(p.revenue)]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tighter text-slate-900 leading-none">Relatórios</h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 italic">Análise de consumo, vendas e performance operacional</p>
        </div>

        <Button onClick={exportToCsv} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {dateRange === "custom" && (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(startDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(endDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="counter">Recepção</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="room">Quarto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Vendido
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.totalSales)}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pedidos
                </CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalOrders}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ticket Médio
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.averageTicket)}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo Médio
                </CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(data.averagePrepTime)} min</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Atrasados
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.delayedOrders}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sales Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Vendas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.salesByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Orders by Type Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-tight">Consumo por Origem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.ordersByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {data.ordersByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-tight">Itens Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}

                {data.topProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum produto vendido no período
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
