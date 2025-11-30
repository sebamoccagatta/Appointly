import { useNavigate, useParams } from "react-router-dom";
import OfferingForm from "../components/OfferingForm";
import {
    useOfferingsList,
    useCreateOffering,
    useUpdateOffering,
} from "../hooks/useOfferings";

export default function OfferingEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data } = useOfferingsList();
    const create = useCreateOffering();
    const update = useUpdateOffering(id!);

    const existing = Array.isArray(data) ? data.find((o: any) => o.id === id) : undefined;

    function handleSubmit(values: any) {
        if (!id || id === "new") {
            create.mutate(values, {
                onSuccess: () => navigate("/admin/offerings"),
            });
        } else {
            update.mutate(values, {
                onSuccess: () => navigate("/admin/offerings"),
            });
        }
    }

    return (
        <div>
            <h1 className="text-xl font-bold text-white mb-4 mt-10">
                {id === "new" ? "Nuevo servicio" : "Editar servicio"}
            </h1>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 max-w-md">
                <OfferingForm
                    initial={existing}
                    onSubmit={handleSubmit}
                    loading={create.isPending || update.isPending}
                />
            </div>
        </div>
    );
}
