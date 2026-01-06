import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Seed initial admin users
    const initialAdmins = [
      { username: 'djalma', password: 'Djalma123', fullName: 'Djalma' },
      { username: 'alison', password: 'Alison123', fullName: 'Alison' },
      { username: 'matheus', password: 'Matheus123', fullName: 'Matheus' },
      { username: 'arthur', password: 'Arthur123', fullName: 'Arthur' },
    ]

    const results = []
    for (const admin of initialAdmins) {
      const email = `${admin.username}@manutencao.local`
      
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const exists = existingUsers?.users?.some(u => u.email === email)
      
      if (exists) {
        results.push({ username: admin.username, status: 'already exists' })
        continue
      }

      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          full_name: admin.fullName,
          username: admin.username,
          role: 'admin'
        }
      })

      if (createError) {
        results.push({ username: admin.username, status: 'error', error: createError.message })
      } else {
        results.push({ username: admin.username, status: 'created' })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
