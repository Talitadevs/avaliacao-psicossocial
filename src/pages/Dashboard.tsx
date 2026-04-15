import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Dashboard({ user }: any) {
    const [profile, setProfile] = useState<any>(null);
    const [risks, setRisks] = useState<any[]>([]);
    const [type, setType] = useState("");
    const [description, setDescription] = useState("");
    const [sector, setSector] = useState("");
    const [probability, setProbability] = useState("");
    const [severity, setSeverity] = useState("");
    const [formActions, setFormActions] = useState<any>({})
    const [inviteName, setInviteName] = useState('')
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('user')
    const [invites, setInvites] = useState<any[]>([])

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

        setProfile(data);

        if (data) {
            loadRisks(data.company_id);
            loadInvites(data.company_id)
        }
    };

    const loadRisks = async (companyId: string) => {
        const { data } = await supabase
            .from("risks")
            .select("*, action_plans(*)")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false });

        setRisks(data || []);
    };

    const calculateRisk = () => {
        const p = Number(probability);
        const s = Number(severity);
        const total = p + s;

        if (total <= 2) return "Baixo";
        if (total <= 4) return "Médio";
        if (total <= 6) return "Alto";
        return "Crítico";
    };

    const createRisk = async () => {
        if (!profile) return;

        await supabase.from("risks").insert([
            {
                company_id: profile.company_id,
                type,
                description,
                sector,
                probability,
                severity,
                risk_level: calculateRisk(),
            },
        ]);

        setType("");
        setDescription("");
        setSector("");

        loadRisks(profile.company_id);
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const createAction = async (riskId: string) => {
        if (!profile) return

        const form = formActions[riskId]

        await supabase.from('action_plans').insert([
            {
                risk_id: riskId,
                company_id: profile.company_id,
                title: form?.title,
                responsible: form?.responsible,
                status: 'Pendente'
            }
        ])

        setFormActions((prev: any) => ({
            ...prev,
            [riskId]: { title: '', responsible: '' }
        }))

        loadRisks(profile.company_id)
    }
    const updateForm = (riskId: string, field: string, value: string) => {
        setFormActions((prev: any) => ({
            ...prev,
            [riskId]: {
                ...prev[riskId],
                [field]: value
            }
        }))
    }

    const updateActionStatus = async (
        actionId: string,
        status: string
    ) => {
        await supabase
            .from('action_plans')
            .update({ status })
            .eq('id', actionId)

        loadRisks(profile.company_id)
    }
    const deleteAction = async (actionId: string) => {
        await supabase
            .from('action_plans')
            .delete()
            .eq('id', actionId)

        loadRisks(profile.company_id)
    }

    const loadInvites = async (companyId: string) => {
        const { data } = await supabase
            .from('invites')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        setInvites(data || [])
    }

    const createInvite = async () => {
        if (!profile) return

        const token = crypto.randomUUID()

        await supabase.from('invites').insert([
            {
                company_id: profile.company_id,
                name: inviteName,
                email: inviteEmail,
                role: inviteRole,
                token
            }
        ])

        setInviteName('')
        setInviteEmail('')
        setInviteRole('user')

        loadInvites(profile.company_id)
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Topbar */}
            <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">NR-1 Risk</h1>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>

                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                    Sair
                </button>
            </header>
            <div className="grid md:grid-cols-4 gap-4 p-6">

                <div className="bg-white rounded-xl shadow p-4">
                    <p className="text-sm text-gray-500">Total de Riscos</p>
                    <h2 className="text-3xl font-bold">{risks.length}</h2>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                    <p className="text-sm text-gray-500">Críticos</p>
                    <h2 className="text-3xl font-bold text-red-600">
                        {risks.filter(r => r.risk_level === 'Crítico').length}
                    </h2>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                    <p className="text-sm text-gray-500">Ações Pendentes</p>
                    <h2 className="text-3xl font-bold text-orange-500">
                        {risks.flatMap(r => r.action_plans || [])
                            .filter((a: any) => a.status !== 'Concluído').length}
                    </h2>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                    <p className="text-sm text-gray-500">Concluídas</p>
                    <h2 className="text-3xl font-bold text-green-600">
                        {risks.flatMap(r => r.action_plans || [])
                            .filter((a: any) => a.status === 'Concluído').length}
                    </h2>
                </div>
                <div className="px-6 pb-6">
                    <div className="bg-white rounded-xl shadow p-5">

                        <h2 className="text-xl font-semibold mb-4">
                            Distribuição de Riscos
                        </h2>

                        <div className="space-y-3">

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Crítico</span>
                                    <span>
                                        {risks.filter(r => r.risk_level === 'Crítico').length}
                                    </span>
                                </div>
                                <div className="h-3 bg-red-500 rounded"></div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Alto</span>
                                    <span>
                                        {risks.filter(r => r.risk_level === 'Alto').length}
                                    </span>
                                </div>
                                <div className="h-3 bg-orange-400 rounded"></div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Médio</span>
                                    <span>
                                        {risks.filter(r => r.risk_level === 'Médio').length}
                                    </span>
                                </div>
                                <div className="h-3 bg-yellow-400 rounded"></div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Baixo</span>
                                    <span>
                                        {risks.filter(r => r.risk_level === 'Baixo').length}
                                    </span>
                                </div>
                                <div className="h-3 bg-green-500 rounded"></div>
                            </div>

                        </div>

                    </div>
                </div>

            </div>
            <div className="grid md:grid-cols-4 gap-4 p-6">
                <div className="bg-white rounded-xl shadow p-4">
                    <p className="text-gray-500 text-sm">Total</p>
                    <h2 className="text-2xl font-bold">{risks.length}</h2>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                    <p className="text-gray-500 text-sm">Críticos</p>
                    <h2 className="text-2xl font-bold text-red-600">
                        {risks.filter((r) => r.risk_level === "Crítico").length}
                    </h2>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                    <p className="text-gray-500 text-sm">Altos</p>
                    <h2 className="text-2xl font-bold text-orange-500">
                        {risks.filter((r) => r.risk_level === "Alto").length}
                    </h2>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                    <p className="text-gray-500 text-sm">Médios/Baixos</p>
                    <h2 className="text-2xl font-bold text-green-600">
                        {
                            risks.filter(
                                (r) => r.risk_level === "Médio" || r.risk_level === "Baixo",
                            ).length
                        }
                    </h2>
                </div>
            </div>

            <div className="p-6 grid md:grid-cols-3 gap-6">
                {/* Form */}
                <div className="bg-white rounded-xl shadow p-5 md:col-span-1">
                    <h2 className="text-xl font-semibold mb-4">Novo Risco</h2>

                    <input
                        className="w-full border p-2 rounded mb-3"
                        placeholder="Tipo"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    />

                    <input
                        className="w-full border p-2 rounded mb-3"
                        placeholder="Descrição"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <input
                        className="w-full border p-2 rounded mb-3"
                        placeholder="Setor"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                    />
                    <select
                        className="w-full border p-2 rounded mb-3"
                        value={probability}
                        onChange={(e) => setProbability(e.target.value)}
                    >
                        <option value="">Probabilidade</option>
                        <option value="1">Baixa</option>
                        <option value="2">Média</option>
                        <option value="3">Alta</option>
                    </select>

                    <select
                        className="w-full border p-2 rounded mb-3"
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                    >
                        <option value="">Severidade</option>
                        <option value="1">Leve</option>
                        <option value="2">Moderada</option>
                        <option value="3">Grave</option>
                    </select>

                    <button
                        onClick={createRisk}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg"
                    >
                        Cadastrar Risco
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow p-5 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Convidar Usuário
                    </h2>

                    <input
                        className="w-full border p-2 rounded mb-3"
                        placeholder="Nome"
                        value={inviteName}
                        onChange={e => setInviteName(e.target.value)}
                    />

                    <input
                        className="w-full border p-2 rounded mb-3"
                        placeholder="Email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                    />

                    <select
                        className="w-full border p-2 rounded mb-3"
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value)}
                    >
                        <option value="user">Usuário</option>
                        <option value="admin">Administrador</option>
                    </select>

                    <div className="bg-white rounded-xl shadow p-5 mb-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Convites
                        </h2>

                        {invites.map(invite => (
                            <div
                                key={invite.id}
                                className="border rounded p-3 mb-2"
                            >
                                <strong>{invite.name}</strong>
                                <p className="text-sm">{invite.email}</p>
                                <p className="text-xs text-blue-600">
                                    /register/{invite.token}
                                </p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={createInvite}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                        Gerar Convite
                    </button>
                </div>

                {/* Lista */}
                <div className="md:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow p-5">
                        <h2 className="text-xl font-semibold">Riscos Cadastrados</h2>
                        <p className="text-gray-500 text-sm">Total: {risks.length}</p>
                    </div>

                    {risks.map((risk) => (
                        <div key={risk.id} className="bg-white rounded-xl shadow p-5">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-800">{risk.type}</h3>

                                <p className="text-gray-600 mt-2">{risk.description}</p>

                                <p className="mt-2 font-semibold text-red-600">
                                    Nível: {risk.risk_level}
                                </p>

                                <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                                    {risk.sector}
                                </span>
                            </div>
                            <div className="mt-4 border-t pt-4">
                                <h4 className="font-semibold mb-2">Plano de Ação</h4>

                                <input
                                    className="w-full border p-2 rounded mb-2"
                                    placeholder="Nova ação"
                                    value={formActions[risk.id]?.title || ''}
                                    onChange={(e) =>
                                        updateForm(risk.id, 'title', e.target.value)
                                    }
                                />
                                <input
                                    className="w-full border p-2 rounded mb-2"
                                    placeholder="Responsável"
                                    value={formActions[risk.id]?.responsible || ''}
                                    onChange={(e) =>
                                        updateForm(risk.id, 'responsible', e.target.value)
                                    }
                                />
                                <button
                                    onClick={() => createAction(risk.id)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg"
                                >
                                    Adicionar Ação
                                </button>

                                <div className="mt-3 space-y-2">
                                    {risk.action_plans?.map((action: any) => (
                                        <div
                                            key={action.id}
                                            className="bg-gray-100 rounded p-3"
                                        >
                                            <strong>{action.title}</strong>

                                            <p className="text-sm text-gray-600">
                                                {action.responsible}
                                            </p>

                                            <div className="flex gap-2 mt-2 flex-wrap">

                                                <select
                                                    value={action.status}
                                                    onChange={(e) =>
                                                        updateActionStatus(action.id, e.target.value)
                                                    }
                                                    className="border rounded px-2 py-1 text-sm"
                                                >
                                                    <option>Pendente</option>
                                                    <option>Em andamento</option>
                                                    <option>Concluído</option>
                                                </select>

                                                <button
                                                    onClick={() => deleteAction(action.id)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Excluir
                                                </button>

                                            </div>
                                        </div>))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
