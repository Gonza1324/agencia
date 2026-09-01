import { cache } from "react";

import { requireOperator } from "@/features/auth/guards";
import type { SettlementHistoryFilters } from "@/features/settlements/history";
import { settlementIdSchema } from "@/features/settlements/validations";

export const getSettlements = cache(
  async (filters: SettlementHistoryFilters) => {
    const { supabase } = await requireOperator();
    const search = filters.search.toLocaleLowerCase("es-AR");
    let matchingSubagentIds: string[] | null = null;

    if (search) {
      const { data: matchingSubagents, error: matchingSubagentsError } =
        await supabase
          .from("subagents")
          .select("id, name, machine_code")
          .limit(500);

      if (matchingSubagentsError) {
        throw new Error(
          `No se pudo buscar el Subagente: ${matchingSubagentsError.message}`,
        );
      }

      matchingSubagentIds = matchingSubagents
        .filter(
          (item) =>
            item.name.toLocaleLowerCase("es-AR").includes(search) ||
            item.machine_code.toLocaleLowerCase("es-AR").includes(search),
        )
        .map((item) => item.id);

      if (!matchingSubagentIds.length) {
        return {
          items: [],
          page: filters.page,
          pageSize: filters.pageSize,
          total: 0,
          totalPages: 0,
        };
      }
    }

    const offset = (filters.page - 1) * filters.pageSize;
    let query = supabase
      .from("daily_settlements")
      .select(
        "id, settlement_date, status, received_amount, debt_amount, subagent:subagents(id, name, machine_code)",
        { count: "exact" },
      )
      .gte("settlement_date", filters.from)
      .lte("settlement_date", filters.to);

    if (filters.status === "active") {
      query = query.neq("status", "voided");
    } else if (filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (matchingSubagentIds) {
      query = query.in("subagent_id", matchingSubagentIds);
    }

    const { count, data, error } = await query
      .order("settlement_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + filters.pageSize - 1);

    if (error) {
      throw new Error(
        `No se pudieron cargar las rendiciones: ${error.message}`,
      );
    }

    const total = count ?? 0;

    return {
      items: data,
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  },
);

export const getSettlementGapSummary = cache(
  async (from: string, to: string) => {
    const { supabase } = await requireOperator();
    const { data, error } = await supabase.rpc("get_settlement_gap_summary", {
      p_from: from,
      p_to: to,
    });

    if (error) {
      throw new Error(
        `No se pudieron calcular los días sin rendición: ${error.message}`,
      );
    }

    return data;
  },
);

export const getSettlementById = cache(async (id: string) => {
  const parsedId = settlementIdSchema.safeParse(id);

  if (!parsedId.success) {
    return null;
  }

  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("daily_settlements")
    .select(
      "*, subagent:subagents(id, name, machine_code), payments:settlement_payments(*)",
    )
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar la rendición: ${error.message}`);
  }

  return data;
});

export const getActiveSubagentsForSettlement = cache(async () => {
  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("subagents")
    .select("id, name, machine_code, commission_percentage")
    .eq("status", "active")
    .order("name");

  if (error) {
    throw new Error(`No se pudieron cargar los Subagentes: ${error.message}`);
  }

  return data;
});
