import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { generateRequestId, withTiming } from '@/lib/db-utils';
import { RequestUpsert } from '@/lib/schema';
import { errorToResponse, ValidationError, NotFoundError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const mineGroup = searchParams.get('mineGroup');
    const mineName = searchParams.get('mineName');
    const personId = searchParams.get('personId');
    const salesperson = searchParams.get('salesperson'); // PRD: Luyanda, James, Stefan
    const showAll = searchParams.get('showAll') === 'true'; // PRD: Toggle for showing all requests
    const limit = parseInt(searchParams.get('limit') || '50');
    
    return await withTiming('GET /api/requests', async () => {
      let query = sql`SELECT * FROM requests WHERE 1=1`;
      const conditions: any[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      // PRD requirement: Filter by salesperson unless showAll is true
      if (!showAll && salesperson && salesperson !== 'all') {
        conditions.push(sql`salesperson_selection = ${salesperson}`);
      }
      
      if (status) {
        conditions.push(sql`status = ${status}`);
      }
      if (mineGroup) {
        conditions.push(sql`mine_group = ${mineGroup}`);
      }
      if (mineName) {
        conditions.push(sql`mine_name = ${mineName}`);
      }
      if (personId) {
        conditions.push(sql`contact->>'personId' = ${personId}`);
      }
      
      if (conditions.length > 0) {
        query = sql`SELECT * FROM requests WHERE ${sql.join(conditions, sql` AND `)} ORDER BY created_at DESC LIMIT ${limit}`;
      } else {
        query = sql`SELECT * FROM requests ORDER BY created_at DESC LIMIT ${limit}`;
      }
      
      const result = await query;
      
      console.log('Requests fetched successfully', { 
        count: result.length, 
        filters: { status, mineGroup, mineName, personId, salesperson, showAll } 
      });
      
      // PRD requirement: Control "New Request" button visibility
      const showNewButton = !showAll;
      
      return Response.json({ 
        ok: true, 
        data: result,
        showNewButton,
        filters: { salesperson, showAll }
      });
    });
    
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestUpsert.parse(body);
    
    return await withTiming('POST /api/requests', async () => {
      // PRD: Support inline updates for contact, line_items, comment
      if (parsed.id) {
        // Update existing request
        const updates: any = {
          updated_at: new Date().toISOString()
        };
        
        if (parsed.contact !== undefined) {
          updates.contact = parsed.contact;
        }
        if (parsed.line_items !== undefined) {
          updates.line_items = parsed.line_items;
        }
        if (parsed.comment !== undefined) {
          updates.comment = parsed.comment;
        }
        
        // Build dynamic update query safely
        const updateFields = Object.keys(updates);
        const updateValues = Object.values(updates);
        
        // Create a simple string-based query for dynamic updates
        const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `UPDATE requests SET ${setClause} WHERE id = $1 RETURNING *`;
        const params = [parsed.id, ...updateValues];
        
        const result = await sql.unsafe(query, ...params);
        
        if (!result || result.length === 0) {
          throw new NotFoundError('Request not found');
        }
        
        console.log('Request updated successfully', { 
          request_id: result[0]?.request_id, 
          inline_update: true 
        });
        
        return Response.json({ ok: true, data: result[0] });
        
      } else {
        // Create new request
        const requestId = await generateRequestId();
        
        const result = await sql`
          INSERT INTO requests (
            request_id,
            salesperson_selection,
            mine_group,
            mine_name,
            contact,
            line_items,
            comment,
            status
          ) VALUES (
            ${requestId},
            ${parsed.salespersonSelection},
            ${parsed.mineGroup},
            ${parsed.mineName},
            ${parsed.contact ? JSON.stringify(parsed.contact) : null},
            ${JSON.stringify(parsed.line_items || [])},
            ${parsed.comment},
            ${'draft'}
          )
          RETURNING *
        `;
        
        console.log('Request created successfully', { 
          request_id: result[0].request_id, 
          inline_update: false 
        });
        
        return Response.json({ ok: true, data: result[0] });
      }
    });
    
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      throw new ValidationError('Missing request ID');
    }
    
    return await withTiming('DELETE /api/requests', async () => {
      const result = await sql`
        DELETE FROM requests WHERE id = ${id} RETURNING id
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Request not found');
      }
      
      console.log('Request deleted successfully', { id });
      return Response.json({ ok: true });
    });
    
  } catch (e) {
    return errorToResponse(e);
  }
}
