// packages/backend/src/routes/webhookRoutes.ts
import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const router = Router();
const prisma = new PrismaClient();
// POST /webhook/handler/:id
router.post('/handler/:id', async (req, res) => {
  const { id } = req.params;
  const requestBody = req.body;
  console.log(`Webhook triggered for workflow ID: ${id}`);

  try {
    // 1. Find the workflow in the database by ID
    const workflow = await prisma.workflow.findUnique({
      where: {
        id: id,
      },
    });

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found.' });
    }

    // 2. Parse the workflow data
    const workflowData = workflow.data as any; // The JSON data of the workflow
    const nodes = workflowData.nodes;
    const edges = workflowData.edges;

    // 3. Find the Webhook trigger node to start from
    const triggerNode = nodes.find((node: any) => node.type === 'Webhook');

    if (!triggerNode) {
      return res.status(400).json({ message: 'Workflow has no Webhook trigger node.' });
    }

    // 4. Start the execution process
    // This is a simplified example. You'll need a proper executor function.
    let currentNode = triggerNode;
    while (currentNode) {
        console.log(`Executing node: ${currentNode.type}`);
        // Find the next node connected by an edge
        const nextEdge = edges.find((edge: any) => edge.source === currentNode.id);
        if (!nextEdge) {
            currentNode = null;
            continue;
        }

        const nextNode = nodes.find((node: any) => node.id === nextEdge.target);
        if (nextNode) {
            // Implement logic for each action type (email, telegram, etc.)
            if (nextNode.type === 'Send email') {
                // Call a function to send an email (e.g., `sendEmail(nextNode.data)`)
                console.log('Action: Sending an email...');
            }
            // Add more `if` statements for other node types
            currentNode = nextNode;
        } else {
            currentNode = null;
        }
    }

    res.status(200).json({ message: 'Workflow executed successfully.' });
  } catch (error) {
    console.error('Error executing webhook:', error);
    res.status(500).json({ message: 'Failed to execute workflow.' });
  }
});

export default router;