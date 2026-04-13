import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, User, Phone, CheckSquare, Square, X, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { formatTime } from "../../lib/date";
import { countOrderCups } from "../../lib/trip";
import { createRider, deleteRider, subscribeToRiders, updateRider } from "../../services/riderService";
import { subscribeToAllSlots } from "../../services/slotService";
import { subscribeToAllOrders } from "../../services/orderService";

const initialForm = { name: "", phone: "", active: true };

const isValidPhone = (phone) => /^[0-9]{9,15}$/.test(phone);

const formatDateLabel = (value) => {
    if (!value) return "-";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default function AdminRider() {
    const [riders, setRiders] = useState([]);
    const [loadingRiders, setLoadingRiders] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialForm);

    const [slots, setSlots] = useState([]);
    const [orders, setOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [riderFilter, setRiderFilter] = useState("all");
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    useEffect(() => {
        const unsubscribe = subscribeToRiders(
            (rows) => {
                setRiders(rows);
                setLoadingRiders(false);
            },
            () => {
                setLoadingRiders(false);
            }
        );

        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, []);

    useEffect(() => {
        const unsubSlots = subscribeToAllSlots((rows) => setSlots(rows));
        const unsubOrders = subscribeToAllOrders((rows) => setOrders(rows));

        return () => {
            if (typeof unsubSlots === "function") unsubSlots();
            if (typeof unsubOrders === "function") unsubOrders();
        };
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setFormData(initialForm);
    };

    const openCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEdit = (rider) => {
        setEditingId(rider.id);
        setFormData({
            name: rider.name || "",
            phone: rider.phone || "",
            active: rider.active !== false,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        const name = formData.name.trim();
        const phone = formData.phone.replace(/\s+/g, "");

        if (!name || !phone) {
            return alert("Please fill in rider name and phone number.");
        }
        if (!isValidPhone(phone)) {
            return alert("Phone number must be 9 to 15 digits.");
        }

        try {
            setSaving(true);
            const payload = { name, phone, active: formData.active };

            if (editingId) {
                await updateRider(editingId, payload);
            } else {
                await createRider(payload);
            }

            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving rider:", error);
            alert("Failed to save rider.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this rider?")) return;

        try {
            await deleteRider(id);
        } catch (error) {
            console.error("Error deleting rider:", error);
            alert("Failed to delete rider.");
        }
    };

    const ridersById = useMemo(() => {
        const map = {};
        riders.forEach((rider) => {
            map[rider.id] = rider;
        });
        return map;
    }, [riders]);

    const historyRows = useMemo(() => {
        return slots
            .filter((slot) => (slot.type || "delivery") === "delivery")
            .map((slot) => {
                const validOrders = orders.filter(
                    (order) =>
                        order.slotId === slot.id &&
                        order.status !== "CANCELLED" &&
                        order.status !== "PENDING_PAYMENT"
                );

                const cups = validOrders.reduce(
                    (sum, order) => sum + countOrderCups(order),
                    0
                );

                const sales = validOrders.reduce((sum, order) => {
                    if (order.paymentStatus !== "PAID") return sum;
                    return sum + (order.totalPrice || 0);
                }, 0);

                const rawDate =
                    slot.dateString ||
                    String(slot.deliveryTime || slot.openTime || "").split("T")[0] ||
                    "-";

                return {
                    id: slot.id,
                    date: formatDateLabel(rawDate),
                    trip: formatTime(slot.deliveryTime || slot.openTime),
                    rider:
                        slot.riderName ||
                        ridersById[slot.riderId]?.name ||
                        "Unassigned",
                    riderPhone:
                        slot.riderPhone ||
                        ridersById[slot.riderId]?.phone ||
                        "-",
                    orders: validOrders.length,
                    cups,
                    sales,
                    sortKey: slot.deliveryTime || slot.openTime || "",
                };
            })
            .sort((a, b) => new Date(b.sortKey) - new Date(a.sortKey));
    }, [slots, orders, ridersById]);

    const riderFilterOptions = useMemo(() => {
        const riderNames = Array.from(
            new Set(historyRows.map((row) => row.rider).filter(Boolean))
        );
        return riderNames.sort((a, b) => a.localeCompare(b));
    }, [historyRows]);

    const filteredHistoryRows = useMemo(() => {
        const keyword = searchQuery.trim().toLowerCase();

        return historyRows.filter((row) => {
            const matchRider =
                riderFilter === "all" ? true : row.rider === riderFilter;
            if (!matchRider) return false;
            if (!keyword) return true;

            const searchableText = `${row.date} ${row.trip} ${row.rider} ${row.riderPhone} ${row.orders} ${row.cups} ${row.sales.toFixed(2)}`.toLowerCase();
            return searchableText.includes(keyword);
        });
    }, [historyRows, riderFilter, searchQuery]);

    useEffect(() => {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, [searchQuery, riderFilter]);

    const columns = useMemo(
        () => [
            {
                accessorKey: "date",
                header: ({ column }) => {
                    const sortState = column.getIsSorted();
                    return (
                        <button
                            type="button"
                            onClick={column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1"
                        >
                            Date
                            {sortState === "asc" ? (
                                <ChevronUp size={14} />
                            ) : sortState === "desc" ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronsUpDown size={14} className="opacity-50" />
                            )}
                        </button>
                    );
                },
                sortingFn: (rowA, rowB) => {
                    const a = new Date(rowA.original.sortKey).getTime() || 0;
                    const b = new Date(rowB.original.sortKey).getTime() || 0;
                    return a - b;
                },
                cell: ({ getValue }) => (
                    <span className="font-medium text-stone-700">{getValue()}</span>
                ),
            },
            {
                accessorKey: "trip",
                header: ({ column }) => {
                    const sortState = column.getIsSorted();
                    return (
                        <button
                            type="button"
                            onClick={column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1"
                        >
                            Trip
                            {sortState === "asc" ? (
                                <ChevronUp size={14} />
                            ) : sortState === "desc" ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronsUpDown size={14} className="opacity-50" />
                            )}
                        </button>
                    );
                },
                sortingFn: (rowA, rowB) => {
                    const a = new Date(rowA.original.sortKey).getTime() || 0;
                    const b = new Date(rowB.original.sortKey).getTime() || 0;
                    return a - b;
                },
                cell: ({ getValue }) => (
                    <span className="font-bold text-stone-800">{getValue() || "-"}</span>
                ),
            },
            {
                accessorKey: "rider",
                header: ({ column }) => {
                    const sortState = column.getIsSorted();
                    return (
                        <button
                            type="button"
                            onClick={column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1"
                        >
                            Rider
                            {sortState === "asc" ? (
                                <ChevronUp size={14} />
                            ) : sortState === "desc" ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronsUpDown size={14} className="opacity-50" />
                            )}
                        </button>
                    );
                },
                cell: ({ row }) => (
                    <div>
                        <p className="font-bold text-stone-800">{row.original.rider}</p>
                        <p className="text-xs text-stone-500">{row.original.riderPhone}</p>
                    </div>
                ),
            },
            {
                accessorKey: "orders",
                header: ({ column }) => {
                    const sortState = column.getIsSorted();
                    return (
                        <button
                            type="button"
                            onClick={column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1"
                        >
                            Orders
                            {sortState === "asc" ? (
                                <ChevronUp size={14} />
                            ) : sortState === "desc" ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronsUpDown size={14} className="opacity-50" />
                            )}
                        </button>
                    );
                },
                cell: ({ getValue }) => (
                    <span className="font-bold text-stone-800">{getValue()}</span>
                ),
            },
            {
                accessorKey: "cups",
                header: ({ column }) => {
                    const sortState = column.getIsSorted();
                    return (
                        <button
                            type="button"
                            onClick={column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1"
                        >
                            Cups
                            {sortState === "asc" ? (
                                <ChevronUp size={14} />
                            ) : sortState === "desc" ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronsUpDown size={14} className="opacity-50" />
                            )}
                        </button>
                    );
                },
                cell: ({ getValue }) => (
                    <span className="font-bold text-stone-800">{getValue()}</span>
                ),
            },
            {
                accessorKey: "sales",
                header: ({ column }) => {
                    const sortState = column.getIsSorted();
                    return (
                        <button
                            type="button"
                            onClick={column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1"
                        >
                            Sales
                            {sortState === "asc" ? (
                                <ChevronUp size={14} />
                            ) : sortState === "desc" ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronsUpDown size={14} className="opacity-50" />
                            )}
                        </button>
                    );
                },
                cell: ({ getValue }) => (
                    <span className="font-black text-emerald-700">
                        RM {getValue().toFixed(2)}
                    </span>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: filteredHistoryRows,
        columns,
        state: {
            sorting,
            pagination,
        },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const totalFilteredRows = table.getPrePaginationRowModel().rows.length;
    const startRow =
        totalFilteredRows === 0
            ? 0
            : pagination.pageIndex * pagination.pageSize + 1;
    const endRow = Math.min(
        (pagination.pageIndex + 1) * pagination.pageSize,
        totalFilteredRows
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Rider Maintenance
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {riders.length} riders created
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-transform"
                >
                    <Plus size={18} /> Add New
                </button>
            </div>

            {loadingRiders ? (
                <p>Loading riders...</p>
            ) : riders.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-dashed border-stone-300 text-center text-stone-400">
                    No riders yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {riders.map((rider) => (
                        <div
                            key={rider.id}
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-stone-100 rounded-full text-stone-600">
                                    <User size={18} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">
                                        {rider.name}
                                    </h3>

                                    <p className="text-sm text-blue-600 font-medium flex items-center gap-1">
                                        <Phone size={14} />
                                        {rider.phone}
                                    </p>

                                    <span
                                        className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            rider.active !== false
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : "bg-stone-100 text-stone-500 border-stone-200"
                                        }`}
                                    >
                                        {rider.active !== false ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEdit(rider)}
                                    className="flex-1 p-2 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 flex justify-center"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(rider.id)}
                                    className="flex-1 p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 flex justify-center"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5 space-y-4">
                <div>
                    <h3 className="text-xl font-bold text-stone-800">Rider History</h3>
                    <p className="text-sm text-stone-500">
                        Delivery trip performance by rider
                    </p>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center gap-3 xl:justify-between">
                    <div className="flex flex-col sm:flex-row gap-2 w-full xl:max-w-2xl">
                        <div className="relative flex-1">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search date, trip, rider, phone, sales..."
                                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm outline-none focus:border-primary"
                            />
                        </div>

                        <select
                            value={riderFilter}
                            onChange={(e) => setRiderFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium outline-none focus:border-primary min-w-45"
                        >
                            <option value="all">All Riders</option>
                            {riderFilterOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-stone-500">
                        <span>Show</span>
                        <select
                            value={pagination.pageSize}
                            onChange={(e) =>
                                setPagination((prev) => ({
                                    ...prev,
                                    pageIndex: 0,
                                    pageSize: Number(e.target.value),
                                }))
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-sm font-bold text-stone-700 outline-none focus:border-primary"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span>per page</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-200 text-sm">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr
                                    key={headerGroup.id}
                                    className="border-b border-stone-200"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="text-left py-3 px-2 font-bold text-stone-500 uppercase text-[11px] tracking-wide"
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-10 text-center text-stone-400"
                                    >
                                        {historyRows.length === 0
                                            ? "No delivery trips found."
                                            : "No records match current search or filter."}
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-stone-100 hover:bg-stone-50"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="py-3 px-2 text-stone-700"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-stone-100">
                    <p className="text-xs text-stone-500">
                        Showing {startRow}-{endRow} of {totalFilteredRows} trips
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-sm font-bold text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50"
                        >
                            Previous
                        </button>

                        <span className="text-xs font-bold text-stone-500 px-2">
                            Page {Math.max(pagination.pageIndex + 1, 1)} of {Math.max(table.getPageCount(), 1)}
                        </span>

                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-sm font-bold text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">
                                {editingId ? "Edit Rider" : "Add New Rider"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}>
                                <X />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <input
                                placeholder="Rider Name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full p-3 bg-gray-50 rounded-xl border focus:border-primary outline-none"
                            />

                            <input
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        phone: e.target.value.replace(/[^\d]/g, ""),
                                    })
                                }
                                className="w-full p-3 bg-gray-50 rounded-xl border focus:border-primary outline-none"
                            />

                            <div
                                onClick={() =>
                                    setFormData({
                                        ...formData,
                                        active: !formData.active,
                                    })
                                }
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100"
                            >
                                {formData.active ? (
                                    <CheckSquare className="text-primary" />
                                ) : (
                                    <Square className="text-gray-400" />
                                )}
                                <span className="font-bold text-gray-700">
                                    Active Rider
                                </span>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold flex justify-center items-center gap-2"
                            >
                                {saving && (
                                    <Loader2 className="animate-spin" size={18} />
                                )}
                                {saving ? "Saving..." : "Save Rider"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}