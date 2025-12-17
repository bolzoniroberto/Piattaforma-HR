import { useEffect, useRef } from "react";
import type { User as UserType } from "@shared/schema";

interface OrgChartAdvancedProps {
  users: UserType[];
  selectedUserId?: string;
  onUserSelect?: (userId: string) => void;
  onUserClick?: (user: UserType) => void;
  zoomLevel?: number;
}

export default function OrgChartAdvanced({
  users,
  onUserClick,
  zoomLevel = 1,
}: OrgChartAdvancedProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const name = `${firstName || ""} ${lastName || ""}`.trim();
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (!chartRef.current || users.length === 0) return;

    // Pulisci il container prima di renderizzare
    if (chartRef.current) {
      chartRef.current.innerHTML = '';
    }

    // Lazy load d3-org-chart
    const loadChart = async () => {
      try {
        const { OrgChart } = await import("d3-org-chart");

        // Trasforma i dati per d3-org-chart
        const data = users.map((user) => ({
          id: user.id,
          parentId: user.managerId || "", // d3-org-chart preferisce stringa vuota per il root
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          email: user.email,
          indirizzo: user.indirizzo,
          _directSubordinates: users.filter((u) => u.managerId === user.id).length,
        }));

        // Crea sempre una nuova istanza per evitare problemi di stato
        const chart = new OrgChart();
        chartInstanceRef.current = chart;

        chart
          .container(chartRef.current)
          .data(data)
          .nodeWidth(() => 180)
          .nodeHeight(() => 200)
          .childrenMargin(() => 60)
          .compactMarginBetween(() => 35)
          .compactMarginPair(() => 30)
          .neighbourMargin(() => 40)
          .siblingsMargin(() => 40)
          .layout("top")
          .compact(false)
          .buttonContent(({ node }: any) => {
            const count = node.data._directSubordinates || 0;
            return `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#3b82f6;color:white;font-size:12px;font-weight:bold;">${count}</div>`;
          })
          .nodeContent((d: any) => {
            const user = d.data;
            const hasSubordinates = user._directSubordinates > 0;

            return `
              <div style="
                width: 180px;
                height: 200px;
                padding: 16px;
                background: hsl(var(--card));
                border: 1px solid hsl(var(--border));
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                transition: all 0.2s;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                position: relative;
              "
              class="org-chart-node"
              data-user-id="${user.id}">
                ${
                  hasSubordinates
                    ? `<div style="
                  position: absolute;
                  top: -8px;
                  right: -8px;
                  width: 24px;
                  height: 24px;
                  background: hsl(var(--primary));
                  color: hsl(var(--primary-foreground));
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 11px;
                  font-weight: bold;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">${user._directSubordinates}</div>`
                    : ""
                }

                <div style="
                  width: 56px;
                  height: 56px;
                  border-radius: 50%;
                  background: hsl(var(--primary) / 0.1);
                  color: hsl(var(--primary));
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 14px;
                  font-weight: 600;
                  border: 2px solid hsl(var(--primary) / 0.2);
                  margin-bottom: 12px;
                ">
                  ${getInitials(user.firstName, user.lastName)}
                </div>

                <div style="text-align: center; width: 100%; flex: 1;">
                  <div style="
                    font-size: 14px;
                    font-weight: 600;
                    color: hsl(var(--primary));
                    margin-bottom: 4px;
                    line-height: 1.2;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                  ">${user.name}</div>

                  <div style="
                    font-size: 11px;
                    color: hsl(var(--muted-foreground));
                    margin-bottom: 8px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  ">${user.department || "N/A"}</div>

                  ${
                    user.indirizzo
                      ? `<div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    font-size: 10px;
                    color: hsl(var(--muted-foreground));
                    margin-bottom: 8px;
                  ">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">📍 ${user.indirizzo}</span>
                  </div>`
                      : ""
                  }
                </div>

                ${
                  hasSubordinates
                    ? `<div style="
                  width: 100%;
                  padding: 4px 8px;
                  background: hsl(var(--primary) / 0.1);
                  color: hsl(var(--primary));
                  border-radius: 6px;
                  font-size: 10px;
                  text-align: center;
                  font-weight: 500;
                  margin-top: auto;
                ">Esplora Team</div>`
                    : ""
                }
              </div>
            `;
          })
          .onNodeClick((nodeId: string) => {
            const user = users.find((u) => u.id === nodeId);
            if (user && onUserClick) {
              onUserClick(user);
            }
          })
          .render();

        // Imposta lo zoom
        if (chart.fit) {
          chart.fit();
        }
      } catch (error) {
        console.error("Errore nel caricamento di d3-org-chart:", error);
      }
    };

    loadChart();

    // Cleanup
    return () => {
      // Non distruggiamo il chart per evitare problemi
    };
  }, [users, zoomLevel, onUserClick]);

  return (
    <div
      ref={chartRef}
      className="w-full min-h-[600px] bg-background rounded-lg"
      style={{
        overflow: "auto",
        position: "relative",
      }}
    />
  );
}
