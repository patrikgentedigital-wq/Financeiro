import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { formatCurrencyBRL, formatDateBR } from '../data/categories';

interface ExportPDFOptions {
  monthName: string;
  transactions: Transaction[];
  coupleName?: string;
}

export function generateMonthlyPDFReport({
  monthName,
  transactions,
  coupleName = 'Finanças do Casal',
}: ExportPDFOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryPurple = '#6D28D9';
  const darkBg = '#1E1B4B';
  const greenText = '#059669';
  const redText = '#DC2626';

  // --- Header Banner ---
  // Top Banner Rect
  doc.setFillColor(30, 27, 75); // #1E1B4B
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Top Accent Bar
  doc.setFillColor(139, 92, 246); // #8B5CF6
  doc.rect(0, 32, pageWidth, 1.5, 'F');

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Finanças do Casal', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(216, 180, 254);
  doc.text(`Relatório Financeiro Mensal • ${coupleName}`, 14, 23);

  // Month Badge (Right align)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(monthName, pageWidth - 14, 18, { align: 'right' });

  const todayStr = new Date().toLocaleDateString('pt-BR');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(196, 181, 253);
  doc.text(`Gerado em: ${todayStr}`, pageWidth - 14, 24, { align: 'right' });

  // --- Financial Highlights (KPI Boxes) ---
  const totalIncome = transactions
    .filter((t) => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

  const startY = 40;
  const cardWidth = (pageWidth - 28 - 12) / 3; // 3 cards
  const cardHeight = 22;

  // Card 1: Receitas
  doc.setFillColor(240, 253, 244); // light green
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, startY, cardWidth, cardHeight, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('RECEITAS TOTAIS', 18, startY + 6);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(formatCurrencyBRL(totalIncome), 18, startY + 15);

  // Card 2: Despesas
  const card2X = 14 + cardWidth + 6;
  doc.setFillColor(254, 242, 242); // light red
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(card2X, startY, cardWidth, cardHeight, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('DESPESAS TOTAIS', card2X + 4, startY + 6);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(formatCurrencyBRL(totalExpenses), card2X + 4, startY + 15);

  // Card 3: Saldo / Poupança
  const card3X = card2X + cardWidth + 6;
  doc.setFillColor(245, 243, 255); // light purple
  doc.setDrawColor(221, 214, 254);
  doc.roundedRect(card3X, startY, cardWidth, cardHeight, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(91, 33, 182);
  doc.text('BALANÇO LÍQUIDO', card3X + 4, startY + 6);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(109, 40, 217);
  doc.text(`${formatCurrencyBRL(netBalance)} (${savingsRate}%)`, card3X + 4, startY + 15);

  // --- Category Breakdown Table ---
  let currentY = startY + cardHeight + 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text('Resumo por Categoria de Gastos', 14, currentY);

  // Compute breakdown map
  const catMap: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type === 'despesa') {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    }
  });

  const catRows = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([catName, val]) => [
      catName,
      totalExpenses > 0 ? `${Math.round((val / totalExpenses) * 100)}%` : '0%',
      formatCurrencyBRL(val),
    ]);

  if (catRows.length > 0) {
    autoTable(doc, {
      startY: currentY + 3,
      head: [['Categoria', '% do Total', 'Valor Gasto']],
      body: catRows,
      theme: 'grid',
      headStyles: {
        fillColor: [109, 40, 217], // purple
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  } else {
    currentY += 8;
  }

  // --- Full Transactions List ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text('Histórico Detalhado de Transações', 14, currentY);

  const txRows = transactions.map((tx) => [
    formatDateBR(tx.date),
    tx.description,
    tx.category,
    tx.isShared ? 'Casal' : 'Individual',
    tx.type === 'receita' ? 'Receita (+)' : 'Despesa (-)',
    `${tx.type === 'receita' ? '+' : '-'} ${formatCurrencyBRL(tx.amount)}`,
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Data', 'Descrição', 'Categoria', 'Escopo', 'Tipo', 'Valor']],
    body: txRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 27, 75], // dark purple
      textColor: 255,
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [245, 243, 255],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 32 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const rawText = String(data.cell.raw);
        if (rawText.startsWith('+')) {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else if (rawText.startsWith('-')) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  // --- Footer Page Numbers ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Finanças do Casal • Documento gerado para controle e planejamento financeiro doméstico',
      14,
      pageHeight - 6
    );

    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 6, {
      align: 'right',
    });
  }

  // Save the PDF
  const filename = `Relatorio_Financeiro_${monthName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
