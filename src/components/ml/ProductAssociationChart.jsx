import { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const ProductAssociationChart = ({ associationRules, onThresholdChange, onExport }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const graphRef = useRef(null);
  
  useEffect(() => {
    if (associationRules && associationRules.rules && associationRules.rules.length > 0) {
      // Process rules into nodes and links
      const nodesMap = new Map();
      const links = [];
      
      // First, create unique nodes for all items
      associationRules.rules.forEach(rule => {
        // Add source item if not already in map
        if (!nodesMap.has(rule.item.item_id)) {
          nodesMap.set(rule.item.item_id, {
            id: rule.item.item_id.toString(),
            name: rule.item.item_name,
            category: rule.item.category,
            val: 10, // Node size
            color: getCategoryColor(rule.item.category)
          });
        }
        
        // Add target item if not already in map
        if (!nodesMap.has(rule.associated_item.item_id)) {
          nodesMap.set(rule.associated_item.item_id, {
            id: rule.associated_item.item_id.toString(),
            name: rule.associated_item.item_name,
            category: rule.associated_item.category,
            val: 10, // Node size
            color: getCategoryColor(rule.associated_item.category)
          });
        }
        
        // Create link between items
        links.push({
          source: rule.item.item_id.toString(),
          target: rule.associated_item.item_id.toString(),
          value: rule.confidence,
          lift: rule.lift || 1,
          support: rule.support
        });
      });
      
      setGraphData({
        nodes: Array.from(nodesMap.values()),
        links
      });
    }
  }, [associationRules]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    
    // Highlight the node and its connections
    const updatedNodes = graphData.nodes.map(n => ({
      ...n,
      highlighted: n.id === node.id
    }));
    
    const updatedLinks = graphData.links.map(link => ({
      ...link,
      highlighted: link.source.id === node.id || link.target.id === node.id
    }));
    
    setGraphData({
      nodes: updatedNodes,
      links: updatedLinks
    });
    
    // Center on the node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  };
  
  // Helper function to get category color
  const getCategoryColor = (category) => {
    const categoryColors = {
      'Coffee': '#6F4E37',
      'Tea': '#00A86B',
      'Food': '#FF9466',
      'Dessert': '#FF69B4',
      'Beverage': '#1E90FF'
    };
    
    return categoryColors[category] || '#571C1F';
  };
  
  if (!associationRules || !associationRules.rules || associationRules.rules.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded text-center">
        <p className="text-gray-500">No product associations found with the current thresholds.</p>
        <p className="text-sm text-gray-400 mt-2">Try lowering the confidence or support thresholds.</p>
        
        <div className="flex items-center mt-4 space-x-4 justify-center">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Confidence</label>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.05" 
              value={associationRules.confidence || 0.3} 
              onChange={(e) => onThresholdChange('confidence', e.target.value)}
              className="w-32"
            />
            <span className="text-xs ml-2">{(associationRules.confidence || 0.3) * 100}%</span>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Support</label>
            <input 
              type="range" 
              min="0.01" 
              max="0.5" 
              step="0.01" 
              value={associationRules.support || 0.01} 
              onChange={(e) => onThresholdChange('support', e.target.value)}
              className="w-32"
            />
            <span className="text-xs ml-2">{(associationRules.support || 0.01) * 100}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Confidence</label>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.05" 
              value={associationRules.confidence} 
              onChange={(e) => onThresholdChange('confidence', e.target.value)}
              className="w-32"
            />
            <span className="text-xs ml-2">{associationRules.confidence * 100}%</span>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Support</label>
            <input 
              type="range" 
              min="0.01" 
              max="0.5" 
              step="0.01" 
              value={associationRules.support} 
              onChange={(e) => onThresholdChange('support', e.target.value)}
              className="w-32"
            />
            <span className="text-xs ml-2">{associationRules.support * 100}%</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onExport('csv')}
            className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button 
            onClick={() => onExport('png')}
            className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Export Image
          </button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel={(node) => `${node.name} (${node.category})`}
          linkLabel={(link) => `Confidence: ${(link.value * 100).toFixed(1)}%, Lift: ${link.lift.toFixed(2)}`}
          linkWidth={(link) => link.highlighted ? 3 : Math.sqrt(link.value) * 3}
          linkColor={(link) => link.highlighted ? '#FF9466' : `rgba(87, 28, 31, ${link.value})`}
          nodeCanvasObject={(node, ctx, globalScale) => {
            // Draw node circle
            const size = node.highlighted ? 14 : 10;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Add a white border to make nodes stand out more
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Draw node label if zoomed in or highlighted
            const label = node.name;
            if (globalScale >= 1 || node.highlighted) {
              const fontSize = node.highlighted ? 14 : 12;
              
              // Add text background for better visibility
              const textWidth = ctx.measureText(label).width;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(node.x - textWidth/2 - 2, node.y + size, textWidth + 4, fontSize + 2);
              
              // Draw text with dark color for better contrast
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.fillStyle = '#333'; // Dark text instead of using node.highlighted
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(label, node.x, node.y + size + fontSize/2 + 1);
            }
          }}
          onNodeClick={handleNodeClick}
        />
      </div>
      
      {selectedNode && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="font-medium">{selectedNode.name}</h3>
          <p className="text-sm text-gray-500">Category: {selectedNode.category}</p>
          <p className="text-sm mt-1">
            Purchased with: {
              graphData.links
                .filter(link => link.source.id === selectedNode.id || link.target.id === selectedNode.id)
                .length
            } other items
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        <p>Hover over nodes to see product details. Click on a node to highlight its connections.</p>
        <p>Thicker lines indicate stronger relationships between products.</p>
      </div>
    </div>
  );
};

export default ProductAssociationChart;