import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function RegisterInvite() {
  const { token } = useParams()

  const [invite, setInvite] = useState<any>(null)
  const [password, setPassword] = useState('')

  useEffect(() => {
    loadInvite()
  }, [])

  const loadInvite = async () => {
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    setInvite(data)
  }

  const register = async () => {
    const { data, error } =
      await supabase.auth.signUp({
        email: invite.email,
        password
      })

    if (error) {
      alert(error.message)
      return
    }

    await supabase.from('profiles').insert([
      {
        user_id: data.user?.id,
        company_id: invite.company_id,
        name: invite.name,
        role: invite.role,
        email: invite.email
      }
    ])

    await supabase
      .from('invites')
      .update({ used: true })
      .eq('id', invite.id)

    alert('Conta criada com sucesso!')
  }

  if (!invite) return <h1>Convite inválido</h1>

  return (
    <div style={{ padding: 30 }}>
      <h1>Bem-vindo {invite.name}</h1>
      <p>{invite.email}</p>

      <input
        type="password"
        placeholder="Crie sua senha"
        onChange={e => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={register}>
        Criar Conta
      </button>
    </div>
  )
}

export default RegisterInvite