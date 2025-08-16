import { NextRequest } from 'next/server';
import { getDb, generateRequestId, withDbErrorHandling } from '@/lib/db';
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
    
    return await withDbErrorHandling(async () => {
      const db = getDb();
      const client = await db.connect();
      
      try {
        let sql = `
          SELECT * FROM requests 
          WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;
        
        // PRD requirement: Filter by salesperson unless showAll is true
        if (!showAll && salesperson && salesperson !== 'all') {
          sql += ` AND salesperson_selection = $${paramIndex}`;
          params.push(salesperson);
          paramIndex++;
        }
        
        if (status) {
          sql += ` AND status = $${paramIndex}`;
          params.push(status);
          paramIndex++;
        }
        if (mineGroup) {
          sql += ` AND mine_group = $${paramIndex}`;
          params.push(mineGroup);
          paramIndex++;
        }
        if (mineName) {
          sql += ` AND mine_name = $${paramIndex}`;
          params.push(mineName);
          paramIndex++;
        }
        if (personId) {
          sql += ` AND contact->>'personId' = $${paramIndex}`;
          params.push(personId);
          paramIndex++;
        }
        
        sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
        params.push(limit);
        
        const result = await client.query(sql, params);
        
        console.log('Requests fetched successfully', { 
          count: result.rows.length, 
          filters: { status, mineGroup, mineName, personId, salesperson, showAll } 
        });
        
        // PRD requirement: Control "New Request" button visibility
        const showNewButton = !showAll;
        
        return Response.json({ 
          ok: true, 
          data: result.rows,
          showNewButton,
          filters: { salesperson, showAll }
        });
        
      } finally {
        client.release();
      }
    }, 'GET /api/requests');
    
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestUpsert.parse(body);
    
    return await withDbErrorHandling(async () => {
      const db = getDb();
      const client = await db.connect();
      
      try {
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
          
          const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
          const updateValues = Object.values(updates);
          
          const sql = `
            UPDATE requests 
            SET ${updateFields}
            WHERE id = $1
            RETURNING *
          `;
          
          const result = await client.query(sql, [parsed.id, ...updateValues]);
          
          if (result.rows.length === 0) {
            throw new NotFoundError('Request not found');
          }
          
          console.log('Request updated successfully', { 
            request_id: result.rows[0].request_id, 
            inline_update: true 
          });
          
          return Response.json({ ok: true, data: result.rows[0] });
          
        } else {
          // Create new request
          const requestId = await generateRequestId();
          
          const sql = `
            INSERT INTO requests (
              request_id,
              salesperson_selection,
              mine_group,
              mine_name,
              contact,
              line_items,
              comment,
              status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `;
          
          const params = [
            requestId,
            parsed.salespersonSelection,
            parsed.mineGroup,
            parsed.mineName,
            parsed.contact ? JSON.stringify(parsed.contact) : null,
            JSON.stringify(parsed.line_items || []),
            parsed.comment,
            'draft'
          ];
          
          const result = await client.query(sql, params);
          
          console.log('Request created successfully', { 
            request_id: result.rows[0].request_id, 
            inline_update: false 
          });
          
          return Response.json({ ok: true, data: result.rows[0] });
        }
        
      } finally {
        client.release();
      }
    }, 'POST /api/requests');
    
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
    
    return await withDbErrorHandling(async () => {
      const db = getDb();
      const client = await db.connect();
      
      try {
        const result = await client.query(
          'DELETE FROM requests WHERE id = $1 RETURNING id',
          [id]
        );
        
        if (result.rows.length === 0) {
          throw new NotFoundError('Request not found');
        }
        
        console.log('Request deleted successfully', { id });
        return Response.json({ ok: true });
        
      } finally {
        client.release();
      }
    }, 'DELETE /api/requests');
    
  } catch (e) {
    return errorToResponse(e);
  }
}
