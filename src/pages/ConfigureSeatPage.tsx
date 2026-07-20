import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from '@/services/api'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  ArrowLeft,
  Armchair,
  BedSingle,
  Crown,
  Square,
  GripHorizontal,
  Bus
} from "lucide-react";

interface Bus {
  _id: string;
  busName: string;
  busType: "Seater" | "Sleeper" | "Limousine";
}

type CellType =
  | "EMPTY"
  | "AISLE"
  | "SEAT"
  | "SLEEPER"
  | "LIMOUSINE_SEAT"
  | "LIMOUSINE_SLEEPER";


const toolConfig: Record<
  CellType,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
  }
> = {
  SEAT: {
    label: "Seat",
    icon: <Armchair size={18} />,
    className:
      "border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200",
  },

  SLEEPER: {
    label: "Sleeper",
    icon: <BedSingle size={18} />,
    className:
      "border-green-300 bg-green-100 text-green-700 hover:bg-green-200",
  },

  LIMOUSINE_SEAT: {
    label: "Limousine Seat",
    icon: <Crown size={18} />,
    className:
      "border-yellow-300 bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  },

  LIMOUSINE_SLEEPER: {
    label: "Limousine Sleeper",
    icon: <Crown size={18} />,
    className:
      "border-purple-300 bg-purple-100 text-purple-700 hover:bg-purple-200",
  },

  AISLE: {
    label: "Aisle",
    icon: <GripHorizontal size={18} />,
    className:
      "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200",
  },

  EMPTY: {
    label: "Empty",
    icon: <Square size={18} />,
    className:
      "border-gray-300 bg-white text-gray-400 hover:bg-gray-50",
  },
};

const getCellStyle = (type: CellType) => {
  switch (type) {
    case "SEAT":
      return {
        icon: <Armchair size={18} />,
        className:
          "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200",
      };

    case "SLEEPER":
      return {
        icon: <BedSingle size={18} />,
        className:
          "bg-green-100 border-green-300 text-green-700 hover:bg-green-200",
      };

    case "LIMOUSINE_SEAT":
      return {
        icon: <Crown size={18} />,
        className:
          "bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200",
      };

    case "LIMOUSINE_SLEEPER":
      return {
        icon: <Crown size={18} />,
        className:
          "bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200",
      };

    case "AISLE":
      return {
        icon: <GripHorizontal size={18} />,
        className:
          "bg-slate-100 border-dashed border-slate-300 text-slate-500 hover:bg-slate-200",
      };

    default:
      return {
        icon: <Square size={18} />,
        className:
          "bg-white border-slate-300 text-slate-300 hover:bg-slate-50",
      };
  }
};

interface SummaryItemProps {
  title: string;
  value: number;
}

function SummaryItem({ title, value }: SummaryItemProps) {
  return (
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function ConfigureSeatPage() {
  const navigate = useNavigate();

  const { id } = useParams();

  const [rows, setRows] = useState(10);

  const [columns, setColumns] = useState(5);

  const [floors, setFloors] = useState(2);

  const [saving, setSaving] = useState(false);

  const [layout, setLayout] =
    useState<CellType[][][]>([]);

  const [isPainting, setIsPainting] = useState(false);

  const [bus, setBus] = useState<Bus | null>(null);

  const [loadingBus, setLoadingBus] = useState(true);

  useEffect(() => {

    const fetchLayout = async () => {

      try {
        const res = await api.get(
          `/partner/buses/${id}/layout`
        );

        const data = res.data.data;

        setRows(data.rows);
        setColumns(data.columns);
        setFloors(data.floors);
        setLayout(data.layout);

      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBus(false);
      }

    };

    fetchLayout();

  }, [id]);

  useEffect(() => {

    const fetchBus = async () => {

      try {
        const res = await api.get(
          `/partner/buses/${id}`
        );

        setBus(res.data.data);


      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBus(false);
      }

    };

    fetchBus();

  }, [id]);

  const generateLayout = () => {

    const data: CellType[][][] = [];

    for (let f = 0; f < floors; f++) {

      const floor: CellType[][] = [];

      for (let r = 0; r < rows; r++) {

        const row: CellType[] = [];

        for (let c = 0; c < columns; c++) {

          if (c === 2) {

            row.push("AISLE");

          } else {

            let defaultSeat: CellType = "SEAT";

            switch (bus?.busType) {
              case "Sleeper":
                defaultSeat = "SLEEPER";
                break;

              case "Limousine":
                defaultSeat = "LIMOUSINE_SEAT";
                break;

              default:
                defaultSeat = "SEAT";
            }

            row.push(defaultSeat);

          }

        }

        floor.push(row);

      }

      data.push(floor);

    }

    setLayout(data);

  };

  useEffect(() => {
    const stopPainting = () => {
      setIsPainting(false);
    };

    window.addEventListener("mouseup", stopPainting);

    return () => {
      window.removeEventListener("mouseup", stopPainting);
    };
  }, []);

  const totalSeats = layout
    .flat(2)
    .filter((cell) =>
      [
        "SEAT",
        "SLEEPER",
        "LIMOUSINE_SEAT",
        "LIMOUSINE_SLEEPER",
      ].includes(cell)
    ).length;

  const summary = {
    seat: 0,
    sleeper: 0,
    limousineSeat: 0,
    limousineSleeper: 0,
    aisle: 0,
    empty: 0,
  };

  layout.flat(2).forEach((cell) => {
    switch (cell) {
      case "SEAT":
        summary.seat++;
        break;

      case "SLEEPER":
        summary.sleeper++;
        break;

      case "LIMOUSINE_SEAT":
        summary.limousineSeat++;
        break;

      case "LIMOUSINE_SLEEPER":
        summary.limousineSleeper++;
        break;

      case "AISLE":
        summary.aisle++;
        break;

      default:
        summary.empty++;
    }
  });

  const getTools = (): CellType[] => {
    if (!bus) return [];

    switch (bus.busType) {
      case "Seater":
        return [
          "SEAT",
          "AISLE",
          "EMPTY",
        ];

      case "Sleeper":
        return [
          "SLEEPER",
          "AISLE",
          "EMPTY",
        ];

      case "Limousine":
        return [
          "LIMOUSINE_SEAT",
          "LIMOUSINE_SLEEPER",
          "AISLE",
          "EMPTY",
        ];

      default:
        return [];
    }
  };

  const tools = getTools();

  const [selectedTool, setSelectedTool] =
    useState<CellType>("SEAT");

  useEffect(() => {
    if (!bus) return;

    switch (bus.busType) {
      case "Seater":
        setSelectedTool("SEAT");
        break;

      case "Sleeper":
        setSelectedTool("SLEEPER");
        break;

      case "Limousine":
        setSelectedTool("LIMOUSINE_SEAT");
        break;
    }
  }, [bus]);

  const paintCell = (
    floor: number,
    row: number,
    column: number
  ) => {

    const current = layout[floor][row][column];

    // Don't repaint if it already has this type
    if (current === selectedTool) return;

    const copy = structuredClone(layout);

    copy[floor][row][column] = selectedTool;

    setLayout(copy);
  };


  const handleSave = async () => {

    if (totalSeats === 0) {

      toast.error("Please add at least one seat.");

      return;

    }

    try {

      setSaving(true);

      await api.post(`/partner/buses/${id}/configure-layout`,
        {
          layout,
        });

      toast.success(
        "Seat layout configured successfully."
      );

      navigate("/buses");

    } catch (err: any) {

      toast.error(
        err.response?.data?.message ||
        "Failed to configure layout."
      );

    } finally {
      setSaving(false);
    }

  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <Button
            variant="ghost"
            className="mb-3"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <h1 className="text-3xl font-bold">
            Configure Seat Layout
          </h1>

          {loadingBus ? (
            <p className="text-slate-500">
              Loading bus...
            </p>
          ) : (
            <>
              <p className="text-slate-500">
                {bus?.busName}
              </p>

              <p className="text-sm text-blue-600 font-medium">
                Bus Type: {bus?.busType}
              </p>
            </>
          )}

        </div>

      </div>

      {/* Layout Settings */}

      <Card>

        <CardHeader>

          <CardTitle>
            Layout Settings
          </CardTitle>

        </CardHeader>

        <CardContent>

          <div className="grid md:grid-cols-3 gap-5">

            <div>

              <Label>
                Total Rows
              </Label>

              <Input
                type="number"
                min={1}
                value={rows}
                onChange={(e) =>
                  setRows(Number(e.target.value))
                }
              />

            </div>

            <div>

              <Label>
                Total Columns
              </Label>

              <Input
                type="number"
                min={2}
                value={columns}
                onChange={(e) =>
                  setColumns(Number(e.target.value))
                }
              />

            </div>

            <div>

              <Label>
                Total Floors
              </Label>

              <Input
                type="number"
                min={1}
                max={2}
                value={floors}
                onChange={(e) =>
                  setFloors(Number(e.target.value))
                }
              />

            </div>

          </div>

          <div className="mt-6 flex justify-between items-center">

            <div>

              <p className="font-medium">
                Total Seats
              </p>

              <p className="text-3xl font-bold text-blue-600">
                {totalSeats}
              </p>

            </div>

            <Button
              disabled={loadingBus || !bus}
              onClick={generateLayout}
            >
              Generate Layout
            </Button>

          </div>

        </CardContent>

      </Card>

      {/* Placeholder */}

      <Card>

        <CardHeader>

          <CardTitle>

            Seat Toolbox

          </CardTitle>

        </CardHeader>

        <CardContent>

          <p className="text-sm text-slate-500 mb-5">

            Select a tool, then click on seats in the layout
            to paint them.

          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

            {tools.map((tool) => {

              const config = toolConfig[tool];

              return (

                <button

                  key={tool}

                  onClick={() =>
                    setSelectedTool(tool)
                  }

                  className={`
                            rounded-xl
                            border
                            p-4
                            transition
                            flex
                            flex-col
                            items-center
                            gap-2

                            ${config.className}

                            ${selectedTool === tool
                      ? "ring-2 ring-blue-500 scale-105"
                      : ""
                    }
                        `}
                >

                  {config.icon}

                  <span className="text-xs font-medium">

                    {config.label}

                  </span>

                </button>

              );

            })}

          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-4">

            <span className="font-medium">

              Current Tool:

            </span>

            <span className="ml-2">

              {toolConfig[selectedTool].label}

            </span>

          </div>

        </CardContent>

      </Card>

      <Card>

        <CardHeader>

          <CardTitle>

            Seat Layout

          </CardTitle>

        </CardHeader>

        <CardContent>

          {layout.length === 0 ? (

            <div className="py-16 text-center text-slate-400">

              Generate a layout first.

            </div>

          ) : (

            <div className="space-y-10 select-none">

              <div className="mb-8 flex flex-col">
                <Bus className="h-7 w-7 text-slate-600" />

                <p className="mt-2 font-semibold">
                  Front of Bus
                </p>
                <div className="text-slate-500 text-xl">
                  ↓
                </div>
              </div>

              {layout.map((floor, floorIndex) => (

                <div key={floorIndex}>

                  <h3 className="mb-4 text-lg font-semibold">

                    Floor {floorIndex + 1}

                  </h3>

                  <div className="flex items-center gap-3 mb-2">

                    <div className="w-8"></div>

                    {Array.from({ length: columns }).map((_, index) => (

                      <div
                        key={index}
                        className="w-14 text-center text-xs text-slate-500"
                      >
                        {index + 1}
                      </div>

                    ))}

                  </div>

                  <div className="flex-col items-center space-y-2">

                    {floor.map((row, rowIndex) => (

                      <div
                        key={rowIndex}
                        className="flex items-center gap-3"
                      >

                        <div className="w-8 text-center text-sm font-medium text-slate-500">

                          {rowIndex + 1}

                        </div>

                        {row.map((cell, columnIndex) => {

                          const style =
                            getCellStyle(cell);

                          return (

                            <button

                              key={columnIndex}

                              onMouseDown={() => {
                                setIsPainting(true);

                                paintCell(
                                  floorIndex,
                                  rowIndex,
                                  columnIndex
                                );
                              }}

                              onMouseEnter={() => {
                                if (!isPainting) return;

                                paintCell(
                                  floorIndex,
                                  rowIndex,
                                  columnIndex
                                );
                              }}

                              className={`
                                                    h-14
                                                    w-14
                                                    rounded-lg
                                                    border
                                                    transition
                                                    flex
                                                    items-center
                                                    justify-center
                                                    ${style.className}
                                                `}
                            >

                              {style.icon}

                            </button>

                          );

                        })}

                      </div>

                    ))}

                  </div>

                </div>

              ))}

            </div>

          )}

        </CardContent>

      </Card>

      <Card>

        <CardHeader>

          <CardTitle>

            Layout Summary

          </CardTitle>

        </CardHeader>

        <CardContent>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            <SummaryItem
              title="Total Seats"
              value={totalSeats}
            />

            {bus?.busType === "Seater" && (
              <SummaryItem
                title="Standard Seats"
                value={summary.seat}
              />
            )}

            {bus?.busType === "Sleeper" && (
              <SummaryItem
                title="Sleepers"
                value={summary.sleeper}
              />
            )}

            {bus?.busType === "Limousine" && (
              <>
                <SummaryItem
                  title="VIP Seats"
                  value={summary.limousineSeat}
                />

                <SummaryItem
                  title="VIP Sleepers"
                  value={summary.limousineSleeper}
                />
              </>
            )}

            <SummaryItem
              title="Aisles"
              value={summary.aisle}
            />

          </div>

        </CardContent>

      </Card>

      <div className="flex justify-end gap-3">

        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>

        <Button
          disabled={
            saving ||
            layout.length === 0
          }
          onClick={handleSave}
        >

          {saving
            ? "Saving..."
            : "Save Layout"}

        </Button>

      </div>

    </div>
  );
}

export default ConfigureSeatPage;