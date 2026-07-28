import { Transaction, RecurrenceFrequency } from '../types';

/**
 * Helper puro para calcular a próxima data com base na frequência da recorrência
 */
export function addRecurrenceInterval(dateStr: string, frequency: RecurrenceFrequency): string {
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  const originalDay = dd;

  if (frequency === 'semanal') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'mensal') {
    d.setMonth(d.getMonth() + 1);
    // Tratar estouro de mês (ex: 31 de janeiro -> 28/29 de fevereiro)
    if (d.getDate() !== originalDay && d.getDate() < 7) {
      d.setDate(0);
    }
  } else if (frequency === 'anual') {
    d.setFullYear(d.getFullYear() + 1);
    // Tratar estouro de ano bissexto (ex: 29 de fevereiro -> 28 de fevereiro no ano seguinte)
    if (d.getDate() !== originalDay && d.getDate() < 7) {
      d.setDate(0);
    }
  }

  const newYyyy = d.getFullYear();
  const newMm = String(d.getMonth() + 1).padStart(2, '0');
  const newDd = String(d.getDate()).padStart(2, '0');

  return `${newYyyy}-${newMm}-${newDd}`;
}

/**
 * Gera automaticamente as próximas ocorrências de uma transação recorrente
 * dentro de uma janela razoável (padrão: 12 meses no futuro ou até a data limite),
 * sem gerar duplicatas se a ocorrência para aquela data já existir no banco/estado.
 */
export function generateRecurringOccurrences(
  baseTx: Transaction,
  existingTxs: Transaction[],
  windowMonths: number = 12
): Transaction[] {
  if (!baseTx.isRecurring || !baseTx.recurrenceFrequency) {
    return [];
  }

  const parentId = baseTx.recurrenceParentId || baseTx.id;
  const frequency = baseTx.recurrenceFrequency;
  const endDateStr = baseTx.recurrenceEndDate || null;

  // Janela limite de tempo (12 meses a partir de hoje)
  const now = new Date();
  const maxLimitDate = new Date(now.getFullYear(), now.getMonth() + windowMonths, now.getDate());
  const maxLimitStr = maxLimitDate.toISOString().split('T')[0];

  const effectiveEndStr = endDateStr && endDateStr < maxLimitStr ? endDateStr : maxLimitStr;

  // Set de datas já existentes para este mesmo modelo/parent
  const existingDates = new Set(
    existingTxs
      .filter((t) => t.id === parentId || t.recurrenceParentId === parentId)
      .map((t) => t.date)
  );

  const newOccurrences: Transaction[] = [];
  let currentDate = addRecurrenceInterval(baseTx.date, frequency);

  // Limite máximo de segurança para loops (ex: 104 semanas = 2 anos)
  let safetyCounter = 0;
  while (currentDate <= effectiveEndStr && safetyCounter < 104) {
    safetyCounter++;

    if (!existingDates.has(currentDate)) {
      const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `rec-${parentId.substring(0, 8)}-${currentDate}`;

      const newTx: Transaction = {
        ...baseTx,
        id: generatedId,
        date: currentDate,
        isRecurring: true,
        recurrenceParentId: parentId,
        version: 1,
      };

      newOccurrences.push(newTx);
      existingDates.add(currentDate);
    }

    currentDate = addRecurrenceInterval(currentDate, frequency);
  }

  return newOccurrences;
}
