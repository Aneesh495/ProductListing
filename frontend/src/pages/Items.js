import React, { useCallback, useEffect, useRef } from 'react';
import { useData } from '../state/DataContext';
import { Link, useSearchParams } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import styled, { createGlobalStyle } from 'styled-components';
import { FiSearch, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { theme } from '../theme';

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
  
  body {
    background-color: ${theme.colors.gray[50]};
    color: ${theme.colors.gray[800]};
    line-height: 1.6;
  }
  
  a {
    text-decoration: none;
    color: inherit;
  }
`;

const Container = styled.div`
  padding: ${theme.spacing[5]} ${theme.spacing[4]};
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
`;

const Header = styled.header`
  margin-bottom: ${theme.spacing[6]};
  text-align: center;
  
  h1 {
    color: ${theme.colors.primary};
    margin-bottom: ${theme.spacing[3]};
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    color: ${theme.colors.gray[600]};
    max-width: 600px;
    margin: 0 auto;
  }
`;

const SearchContainer = styled.div`
  margin: ${theme.spacing[6]} auto;
  max-width: 600px;
  position: relative;
  
  @media (max-width: 640px) {
    margin: ${theme.spacing[4]} ${theme.spacing[4]};
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${theme.spacing[3]} ${theme.spacing[5]} ${theme.spacing[3]} ${theme.spacing[10]};
  font-size: 1rem;
  border: 2px solid ${theme.colors.gray[200]};
  border-radius: ${theme.borderRadius.full};
  background-color: ${theme.colors.white};
  box-shadow: ${theme.shadows.sm};
  transition: ${theme.transition};
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }
  
  &::placeholder {
    color: ${theme.colors.gray[400]};
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: ${theme.spacing[4]};
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.gray[400]};
  font-size: 1.25rem;
`;

const Card = styled.div`
  background: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  overflow: hidden;
  margin-bottom: ${theme.spacing[6]};
  transition: ${theme.transition};
  
  &:hover {
    box-shadow: ${theme.shadows.lg};
    transform: translateY(-2px);
  }
`;

const ItemsList = styled.div`
  border-radius: ${theme.borderRadius.md};
  overflow: hidden;
  margin-bottom: ${theme.spacing[6]};
  background: ${theme.colors.white};
  box-shadow: ${theme.shadows.sm};
`;

const ItemRow = styled.div`
  display: flex;
  padding: ${theme.spacing[4]} ${theme.spacing[5]};
  border-bottom: 1px solid ${theme.colors.gray[100]};
  align-items: center;
  background: ${props => (props.index % 2 === 0 ? theme.colors.white : theme.colors.gray[50])};
  transition: ${theme.transition};
  cursor: pointer;
  
  &:hover {
    background-color: ${theme.colors.gray[100]};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemName = styled(Link)`
  color: ${theme.colors.primary};
  font-weight: 500;
  text-decoration: none;
  transition: ${theme.transition};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  
  &:hover {
    color: ${theme.colors.secondary};
    text-decoration: none;
  }
`;

const ItemIcon = styled.div`
  color: ${theme.colors.primary};
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-left: 16px;
  background: ${theme.colors.primary}10;
  border-radius: 50%;
  flex-shrink: 0;
  
  ${ItemName}:hover & {
    background: ${theme.colors.primary}20;
  }
`;

const ItemPrice = styled.span`
  font-weight: 700;
  color: ${theme.colors.success};
  min-width: 100px;
  text-align: right;
  font-size: 1.1rem;
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

const ErrorMessage = styled.div`
  padding: ${theme.spacing[4]};
  background-color: ${theme.colors.danger}10;
  color: ${theme.colors.danger};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing[6]};
  border-left: 4px solid ${theme.colors.danger};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  
  &:before {
    content: "⚠️";
    font-size: 1.2rem;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing[4]};
  margin-top: ${theme.spacing[6]};
  padding: ${theme.spacing[4]} ${theme.spacing[8]} 0;
  border-top: 1px solid ${theme.colors.gray[200]};
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    padding: ${theme.spacing[4]} ${theme.spacing[4]} 0;
  }
`;

const PageInfo = styled.span`
  color: ${theme.colors.gray[600]};
  font-size: 0.95rem;
  padding: 0 ${theme.spacing[2]};
  flex: 1;
  min-width: 200px;
  text-align: left;
  
  @media (max-width: 640px) {
    text-align: center;
    margin-bottom: ${theme.spacing[2]};
  }
`;

const PageControls = styled.div`
  display: flex;
  gap: ${theme.spacing[2]};
  flex: 1;
  justify-content: flex-end;
  
  @media (max-width: 640px) {
    justify-content: center;
  }
`;

const Button = styled.button`
  padding: ${theme.spacing[2]} ${theme.spacing[4]};
  background-color: ${props => props.disabled ? theme.colors.gray[200] : theme.colors.primary};
  color: ${props => props.disabled ? theme.colors.gray[500] : theme.colors.white};
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
  transition: ${theme.transition};
  min-width: 36px;
  
  &:hover:not(:disabled) {
    background-color: ${theme.colors.secondary};
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.md};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  svg {
    font-size: 1.1em;
  }
`;

const Row = React.memo(({ index, style, data }) => {
  const item = data.items[index];
  if (!item) return null;
  
  const IconComponent = item.Icon || (() => null);
  
  return (
    <ItemRow index={index} style={style}>
      <ItemName to={`/items/${item.id}`}>
        <ItemIcon>
          <IconComponent />
        </ItemIcon>
        <span>{item.name}</span>
      </ItemName>
      <ItemPrice>${item.price?.toFixed(2)}</ItemPrice>
    </ItemRow>
  );
});

// Add display name for better debugging
Row.displayName = 'Row';

function Items() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const {
    items,
    loading,
    error,
    pagination,
    fetchItems
  } = useData();
  
  // Debounce search
  const debounceTimeout = useRef();
  
  const debouncedSearch = useCallback((query) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      setSearchParams({ page: 1, q: query });
    }, 300);
  }, [setSearchParams]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    debouncedSearch(query);
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    window.scrollTo(0, 0);
    setSearchParams({ page: newPage, q: searchQuery });
  };

  // Fetch items when component mounts or search params change
  useEffect(() => {
    fetchItems(page, 10, searchQuery);
  }, [page, searchQuery, fetchItems]);

  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <h1>Product Catalog</h1>
          <p>Browse our amazing selection of products</p>
        </Header>
        
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search products..."
            defaultValue={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search products"
          />
        </SearchContainer>
        
        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}
        
        <Card>
          <ItemsList>
            {loading ? (
              <Loading>Loading products...</Loading>
            ) : items.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                No products found. Try a different search term.
              </div>
            ) : (
              <AutoSizer disableHeight>
                {({ width }) => (
                  <List
                    height={Math.min(600, items.length * 72)}
                    itemCount={items.length}
                    itemSize={72}
                    width={width}
                    itemData={{ items }}
                    style={{ outline: 'none' }}
                  >
                    {Row}
                  </List>
                )}
              </AutoSizer>
            )}
          </ItemsList>
          
          <Pagination>
            <PageInfo>
              Showing {pagination.page * pagination.limit - pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
            </PageInfo>
            <PageControls>
              <Button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                aria-label="First page"
              >
                <FiChevronsLeft />
              </Button>
              <Button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage}
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </Button>
              <Button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                aria-label="Next page"
              >
                <FiChevronRight />
              </Button>
              <Button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                aria-label="Last page"
              >
                <FiChevronsRight />
              </Button>
            </PageControls>
          </Pagination>
        </Card>
      </Container>
    </>
  );
}

export default Items;