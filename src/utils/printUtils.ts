import { Order } from "@/hooks/useOrders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface PrinterSettings {
  paperWidth: "58mm" | "80mm";
  autoPrint: boolean;
  fontSize: "small" | "normal" | "large";
  printerName?: string;
  showHeader?: boolean;
  showNotes?: boolean;
  showCustomerInfo?: boolean; // New
  customFooter?: string;      // New
}

const generateReceiptHTML = (order: Order, settings: PrinterSettings, isPdfRequest = false) => {
  // 80mm paper -> Safe zone is usually ~72mm, but to be 100% safe against "cutting": use 64mm. (16mm total margin)
  // 58mm paper -> Safe zone ~48mm -> use 42mm.
  const safeWidth = settings.paperWidth === "58mm" ? "45mm" : "65mm";
  const baseFontSize = settings.fontSize === "small" ? "10px" : settings.fontSize === "large" ? "13px" : "11px";

  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  const formatDate = (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });

  const customerName = order.customers?.full_name || "Cliente não ident.";
  const customerPhone = order.customers?.phone || "";
  const addressLabel = order.order_type === 'delivery' ? "ENTREGA" : "LOCAL";
  const addressValue = order.order_type === 'delivery'
    ? (order.delivery_address || "Retirada no Balcão")
    : (order.room_number ? `${order.order_type === 'room' ? 'Quarto' : 'Mesa'} ${order.room_number}` : "Balcão");

  const paymentLabel = order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'card' ? 'Cartão' : 'Dinheiro';

  // Items
  const itemsRows = order.order_items?.map(item => `
        <div class="item-row">
            <div class="item-qty">${item.quantity}x</div>
            <div class="item-name">
                ${item.product_name}
                ${item.selected_addons && item.selected_addons.length > 0 ?
      `<div class="addons">+ ${item.selected_addons.map((a: any) => `${a.quantity}x ${a.name}`).join(', ')}</div>`
      : ""}
                ${item.notes ? `<div class="item-note">Obs: ${item.notes}</div>` : ""}
            </div>
            <div class="item-price">${formatCurrency(item.unit_price * item.quantity)}</div>
        </div>
    `).join("") || "";

  const totalsSection = `
        <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(order.total - (order.delivery_fee || 0))}</span></div>
        ${order.delivery_fee ? `<div class="summary-row"><span>Taxa de Entrega</span><span>${formatCurrency(order.delivery_fee)}</span></div>` : ""}
        <div class="summary-row total-big"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></div>
    `;

  const css = `
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');
        
        /* Reset margins on the page print */
        @page { margin: 0; size: auto; }
        
        * { box-sizing: border-box; }
        
        body {
            font-family: 'Roboto Mono', 'Courier New', monospace;
            font-size: ${baseFontSize};
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center; /* Center the receipt strip in the page */
        }

        /* The Receipt Container - This is where we force the width */
        .receipt-container {
            width: ${isPdfRequest ? safeWidth : '100%'};
            max-width: ${safeWidth};
            padding: 5px 0; /* Vertical padding only, horiz handled by max-width centering */
            margin: 0 auto;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: 700; }
        .uppercase { text-transform: uppercase; }
        
        .brand-header { margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .brand-name { font-size: 1.4em; font-weight: 900; }
        .brand-sub { font-size: 0.9em; }

        .order-info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
        .order-number { font-size: 1.8em; font-weight: 900; margin: 5px 0; }
        
        .customer-box { margin-bottom: 15px; border: 1px solid #000; padding: 8px; border-radius: 4px; }
        .field-label { font-size: 0.8em; font-weight: bold; color: #444; }
        .field-val { font-size: 1.1em; font-weight: bold; margin-bottom: 4px; }

        .items-header { font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 8px; padding-bottom: 4px; display: flex; align-items: center; }
        .col-qty { width: 30px; flex-shrink: 0; }
        .col-item { flex-grow: 1; padding-right: 5px; }
        .col-price { width: 65px; text-align: right; }

        .item-row { display: flex; margin-bottom: 8px; align-items: flex-start; }
        .item-qty { width: 30px; font-weight: bold; flex-shrink: 0; }
        .item-name { flex-grow: 1; padding-right: 5px; }
        .item-price { font-weight: bold; white-space: nowrap; width: 65px; text-align: right; }
        .addons { font-size: 0.85em; color: #333; margin-top: 2px; }
        .item-note { font-size: 0.85em; font-style: italic; margin-top: 2px; background: #eee; padding: 2px 4px; border-radius: 2px; display: inline-block; }

        .summary-section { margin-top: 15px; border-top: 2px dashed #000; padding-top: 10px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .total-big { font-size: 1.5em; font-weight: 900; margin-top: 5px; border-top: 1px solid #000; padding-top: 5px; }

        .footer { margin-top: 20px; font-size: 0.8em; text-align: center; color: #555; border-top: 1px dotted #ccc; padding-top: 10px; }
        
        .tag-delivery { background: #000; color: #fff; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 0.9em; font-weight: bold; letter-spacing: 0.5px; }
        .tag-local { border: 1px solid #000; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 0.9em; font-weight: bold; letter-spacing: 0.5px; }
    `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pedido #${order.order_number}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${css}</style>
      </head>
      <body>
        <div class="receipt-container">
            ${settings.showHeader !== false ? `
            <div class="brand-header text-center">
                <div class="brand-name">BURGER POUSADA</div>
                <div class="brand-sub">Recibo de Pedido</div>
            </div>
            ` : ''}

            <div class="order-info text-center">
                <div>SENHA / PEDIDO</div>
                <div class="order-number">#${order.order_number}</div>
                <div>${formatDate(order.created_at)}</div>
                <div class="${order.order_type === 'delivery' ? 'tag-delivery' : 'tag-local'} uppercase">
                    ${order.order_type === 'delivery' ? 'Entrega Moto' : 'Mesa / Balcão'}
                </div>
            </div>

            ${settings.showCustomerInfo !== false ? `
            <div class="customer-box">
                <div class="field-label">CLIENTE</div>
                <div class="field-val">${customerName}</div>
                ${customerPhone ? `<div class="field-val" style="font-size:0.9em">${customerPhone}</div>` : ''}
                
                <div class="field-label" style="margin-top: 8px;">${addressLabel}</div>
                <div class="field-val">${addressValue}</div>
            </div>
            ` : ''}

            <div>
                <div class="items-header">
                    <div class="col-qty">QTD</div>
                    <div class="col-item">ITEM</div>
                    <div class="col-price">TOTAL</div>
                </div>
                ${itemsRows}
            </div>

            <div class="summary-section">
                ${totalsSection}
                
                <div style="margin-top: 10px; text-align: right;">
                    <span style="font-size: 0.9em;">Pagamento:</span> <span class="bold uppercase">${paymentLabel}</span>
                </div>
            </div>

            ${(settings.showNotes !== false && order.notes) ? `
            <div style="margin-top: 15px; border: 2px solid #000; padding: 8px; position: relative;">
                <div style="position: absolute; top: -10px; left: 10px; background: #fff; padding: 0 5px; font-weight: bold; font-size: 0.9em;">OBSERVAÇÕES</div>
                ${order.notes}
            </div>
            ` : ''}

            <div class="footer">
                ${settings.customFooter ? settings.customFooter.replace(/\n/g, '<br/>') : 'Obrigado pela preferência!<br/>www.burgerpousada.com.br'}
            </div>
        </div>
      </body>
    </html>
    `;
};

// Use Popup Window Strategy - Most Reliable for isolating print context
const printViaPopup = (htmlContent: string, width: string) => {
  // 58mm ~ 300px window, 80mm ~ 400px window
  const winWidth = width === "58mm" ? 350 : 450;

  // Center the popup
  const left = (window.screen.width / 2) - (winWidth / 2);
  const top = (window.screen.height / 2) - (600 / 2);

  const printWindow = window.open("", "_blank", `width=${winWidth},height=600,top=${top},left=${left},status=no,menubar=no,toolbar=no,scrollbars=yes`);

  if (!printWindow) {
    alert("Pop-up bloqueado. Por favor, permita pop-ups para imprimir.");
    return;
  }

  try {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for potential images or fonts
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Automatically close after print dialog (optional, some users prefer to keep it open to check)
      // printWindow.close();
    }, 500);
  } catch (e) {
    console.error("Print Error", e);
  }
};

export const printOrderReceipt = (order: Order, settings: PrinterSettings) => {
  const htmlContent = generateReceiptHTML(order, settings, false);
  printViaPopup(htmlContent, settings.paperWidth);
};

export const printTestReceipt = (settings: PrinterSettings) => {
  const testOrder: Order = {
    id: "test-123",
    order_number: 1234,
    customer_id: "cust-1",
    order_type: "delivery",
    status: "pending",
    payment_method: "pix",
    notes: "Sem cebola no burger.",
    total: 145.50,
    delivery_fee: 5.00,
    room_number: null,
    created_at: new Date().toISOString(),
    customers: { full_name: "João da Silva", phone: "(11) 99999-9999" } as any,
    delivery_address: "Rua das Flores, 123 - Centro",
    order_items: [
      { id: "1", product_name: "X-Burger Premium", quantity: 2, unit_price: 35.00, notes: "Bem passado", selected_addons: [{ name: "Bacon", quantity: 1 } as any] },
      { id: "2", product_name: "Coca-Cola 2L", quantity: 1, unit_price: 12.00, notes: null, selected_addons: [] },
      { id: "3", product_name: "Batata Frita G", quantity: 1, unit_price: 25.00, notes: null, selected_addons: [] }
    ]
  };
  printOrderReceipt(testOrder, settings);
};

export const downloadPDF = async (settings: PrinterSettings) => {
  try {
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;

    const testOrder: Order = {
      id: "test-123",
      order_number: 1234,
      customer_id: "cust-1",
      order_type: "delivery",
      status: "pending",
      payment_method: "pix",
      notes: "Sem cebola no burger.",
      total: 145.50,
      delivery_fee: 5.00,
      room_number: null,
      created_at: new Date().toISOString(),
      customers: { full_name: "João da Silva", phone: "(11) 99999-9999" } as any,
      delivery_address: "Rua das Flores, 123 - Centro",
      order_items: [
        { id: "1", product_name: "X-Burger Premium", quantity: 2, unit_price: 35.00, notes: "Bem passado", selected_addons: [{ name: "Bacon", quantity: 1 }] } as any,
        { id: "2", product_name: "Coca-Cola 2L", quantity: 1, unit_price: 12.00, notes: null } as any,
        { id: "3", product_name: "Batata Frita G", quantity: 1, unit_price: 25.00, notes: null } as any
      ]
    };

    const htmlContent = generateReceiptHTML(testOrder, settings, true);

    // Container for canvas capture
    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "absolute",
      top: "-10000px",
      left: "0",
      // Use slightly wider container for high-res PDF generation, then scale down
      width: settings.paperWidth === "58mm" ? "280px" : "380px",
      background: "white",
      height: "auto", // Allow adaptation
      overflow: "visible"
    });
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Wait for rendering and images
    await new Promise(r => setTimeout(r, 300));

    // Use a cleaner selector or just capture the container
    const canvas = await html2canvas(container, {
      scale: 2,
      logging: false,
      backgroundColor: "#ffffff",
      width: container.scrollWidth,
      height: container.scrollHeight, // Explicitly capture full scroll height
      windowHeight: container.scrollHeight
    });

    document.body.removeChild(container);

    // Convert to PDF
    const imgData = canvas.toDataURL("image/png");

    // PDF Dimensions calculation
    // 1mm = 2.83465 pt
    // 80mm = ~226pt
    const pdfWidthPt = settings.paperWidth === "58mm" ? 164 : 226;
    const pdfHeightPt = (canvas.height * pdfWidthPt) / canvas.width;

    const pdf = new jsPDF({
      unit: 'pt',
      format: [pdfWidthPt, pdfHeightPt] // Dynamic height PDF
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthPt, pdfHeightPt);
    pdf.save(`pedido_${new Date().getTime()}.pdf`);

    return true;
  } catch (error) {
    console.error("Erro fatal ao gerar PDF:", error);
    throw error;
  }
};
