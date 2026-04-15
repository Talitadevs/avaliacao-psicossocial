import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user

    if (!user) return

    const { data: companyData } = await supabase
      .from('companies')
      .insert([{ name: company }])
      .select()
      .single()

    await supabase.from('profiles').insert([
      {
        user_id: user.id,
        company_id: companyData.id,
        name,
        role: 'admin'
      }
    ])

    alert('Conta criada com sucesso!')
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    alert('Login realizado!')
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>{isLogin ? 'Login' : 'Cadastro'}</h1>

      {!isLogin && (
        <>
          <input placeholder="Nome" onChange={e => setName(e.target.value)} />
          <br /><br />
          <input placeholder="Empresa" onChange={e => setCompany(e.target.value)} />
          <br /><br />
        </>
      )}

      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <br /><br />

      <input
        type="password"
        placeholder="Senha"
        onChange={e => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={isLogin ? handleLogin : handleSignup}>
        {isLogin ? 'Entrar' : 'Cadastrar'}
      </button>

      <br /><br />

      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Criar conta' : 'Já tenho conta'}
      </button>
    </div>
  )
}

export default Auth