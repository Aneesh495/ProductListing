import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiArrowLeft } from 'react-icons/fi';
import { theme } from '../theme';
import { useData } from '../state/DataContext';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${theme.spacing[6]} ${theme.spacing[4]};
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing[6]};
  font-weight: 500;
  text-decoration: none;
  transition: ${theme.transition};
  
  &:hover {
    color: ${theme.colors.secondary};
    transform: translateX(-4px);
  }
  
  svg {
    transition: ${theme.transition};
  }
  
  &:hover svg {
    transform: translateX(-4px);
  }
`;

const Card = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
  transition: ${theme.transition};
  
  &:hover {
    box-shadow: ${theme.shadows.xl};
    transform: translateY(-2px);
  }
`;

const ItemHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  padding: ${theme.spacing[8]} ${theme.spacing[6]};
  background: linear-gradient(135deg, ${theme.colors.primary}10, ${theme.colors.secondary}10);
  border-bottom: 1px solid ${theme.colors.gray[100]};
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
  }
`;

const ItemImage = styled.div`
  width: 100%;
  max-width: 400px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.md};
  background-color: ${theme.colors.gray[50]};
  overflow: hidden;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (min-width: 768px) {
    width: 40%;
    height: 300px;
  }
`;

const ItemIconLarge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  margin-left: 24px;
  color: ${theme.colors.primary};
  background: ${theme.colors.primary}08;
  border-radius: 50%;
  
  svg {
    width: 100px;
    height: 100px;
    opacity: 0.9;
    padding: 8px;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemTitle = styled.h1`
  font-size: 2rem;
  color: ${theme.colors.dark};
  margin-bottom: ${theme.spacing[3]};
  line-height: 1.2;
`;

const ItemPrice = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${theme.colors.success};
  margin-bottom: ${theme.spacing[4]};
`;

const ItemMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[4]};
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  
  span:first-child {
    font-size: 0.875rem;
    color: ${theme.colors.gray[600]};
    margin-bottom: ${theme.spacing[1]};
  }
  
  span:last-child {
    font-weight: 500;
    color: ${theme.colors.gray[900]};
  }
`;

const ItemBody = styled.div`
  padding: ${theme.spacing[6]};
  
  h3 {
    font-size: 1.25rem;
    color: ${theme.colors.dark};
    margin-bottom: ${theme.spacing[3]};
    padding-bottom: ${theme.spacing[2]};
    border-bottom: 1px solid ${theme.colors.gray[200]};
  }
  
  p {
    color: ${theme.colors.gray[700]};
    line-height: 1.7;
    margin-bottom: ${theme.spacing[4]};
  }
`;

const Loading = styled.div`
  padding: ${theme.spacing[10]} ${theme.spacing[4]};
  text-align: center;
  color: ${theme.colors.gray[500]};
  font-size: 1.1rem;
  
  &:after {
    content: "";
    display: inline-block;
    width: 40px;
    height: 40px;
    margin: 0 auto;
    border: 4px solid ${theme.colors.gray[200]};
    border-top-color: ${theme.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { getCategoryIcon } = useData();
  
  // Get the icon component based on the item's category and name
  const IconComponent = item ? getCategoryIcon(item.category, item.name) : null;

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:3001/api/items/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Item not found');
        return res.json();
      })
      .then(data => {
        setItem(data);
        setError(null);
      })
      .catch(err => {
        console.error('Error fetching item:', err);
        setError(err.message);
        setTimeout(() => navigate('/'), 2000);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return <Loading>Loading product details...</Loading>;
  }

  if (error) {
    return (
      <Container>
        <div style={{ 
          padding: theme.spacing[6],
          backgroundColor: theme.colors.danger + '10',
          color: theme.colors.danger,
          borderRadius: theme.borderRadius.md,
          borderLeft: `4px solid ${theme.colors.danger}`,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[3]
        }}>
          <span>⚠️</span>
          <div>
            <p style={{ marginBottom: theme.spacing[1] }}>Error: {error}</p>
            <p>Redirecting to home page...</p>
          </div>
        </div>
      </Container>
    );
  }

  // Generate a placeholder image URL based on item ID
  const imageUrl = `https://picsum.photos/seed/item-${id}/800/600`;

  return (
    <Container>
      <BackButton to="/">
        <FiArrowLeft /> Back to Products
      </BackButton>
      
      <Card>
        <ItemHeader>
          <ItemImage>
            <ItemIconLarge>
              {IconComponent ? (
                <IconComponent />
              ) : (
                <img 
                  src={item.image || imageUrl} 
                  alt={item.name} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = imageUrl;
                  }}
                />
              )}
            </ItemIconLarge>
          </ItemImage>
          
          <ItemInfo>
            <ItemMeta>
              <MetaItem>
                <span>Category</span>
                <span>{item.category || 'Uncategorized'}</span>
              </MetaItem>
              <MetaItem>
                <span>SKU</span>
                <span>{item.id}</span>
              </MetaItem>
              {item.stock !== undefined && (
                <MetaItem>
                  <span>In Stock</span>
                  <span>{item.stock} units</span>
                </MetaItem>
              )}
            </ItemMeta>
            
            <ItemTitle>{item.name}</ItemTitle>
            <ItemPrice>${item.price?.toFixed(2)}</ItemPrice>
            
            {item.description && (
              <p style={{ color: theme.colors.gray[700], marginTop: theme.spacing[4] }}>
                {item.description}
              </p>
            )}
          </ItemInfo>
        </ItemHeader>
        
        {(item.details || item.specs) && (
          <ItemBody>
            {item.details && (
              <div style={{ marginBottom: theme.spacing[6] }}>
                <h3>Product Details</h3>
                <p>{item.details}</p>
              </div>
            )}
            
            {item.specs && (
              <div>
                <h3>Specifications</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: theme.spacing[4] }}>
                  {Object.entries(item.specs).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ItemBody>
        )}
      </Card>
    </Container>
  );
}

export default ItemDetail;