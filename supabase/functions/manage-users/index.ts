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

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, username, password, fullName, role, userId, newPassword, sector } = await req.json()

    if (action === 'create') {
      // Create user with username as email format
      const email = `${username.toLowerCase()}@manutencao.local`
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          username: username.toLowerCase(),
          role: role
        }
      })

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // If it's an employee, update the technician's sector
      if (role === 'employee' && sector && newUser?.user?.id) {
        // Wait a bit for the trigger to create the technician record
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const { error: updateError } = await supabaseAdmin
          .from('technicians')
          .update({ sector: sector })
          .eq('user_id', newUser.user.id)
        
        if (updateError) {
          console.error('Error updating technician sector:', updateError)
        } else {
          console.log('Technician sector updated to:', sector)
        }
      }

      return new Response(JSON.stringify({ success: true, user: newUser }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'seed') {
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
    }

    if (action === 'list') {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, email, created_at')
        .order('created_at', { ascending: false })

      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, role')

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role || 'employee'
      }))

      return new Response(JSON.stringify({ users: usersWithRoles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'delete') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      if (userId === user.id) {
        return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Deleting user:', userId)

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (deleteError) {
        console.error('Delete error:', deleteError)
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('User deleted successfully')
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'update-password') {
      if (!userId || !newPassword) {
        return new Response(JSON.stringify({ error: 'userId and newPassword are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Updating password for user:', userId)

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      })
      
      if (updateError) {
        console.error('Update password error:', updateError)
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Password updated successfully')
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
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
