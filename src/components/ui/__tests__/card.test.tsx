import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default classes', () => {
      render(<Card data-testid="card">Card content</Card>)
      
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm')
    })

    it('should apply custom className', () => {
      render(<Card className="custom-class" data-testid="card">Card content</Card>)
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
    })

    it('should forward ref correctly', () => {
      const ref = vi.fn()
      render(<Card ref={ref} data-testid="card">Card content</Card>)
      
      expect(ref).toHaveBeenCalled()
    })

    it('should support all HTML div attributes', () => {
      render(
        <Card 
          id="test-card" 
          data-testid="card"
          role="region"
          aria-label="Test card"
        >
          Card content
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('id', 'test-card')
      expect(card).toHaveAttribute('role', 'region')
      expect(card).toHaveAttribute('aria-label', 'Test card')
    })
  })

  describe('CardHeader', () => {
    it('should render with default classes', () => {
      render(<CardHeader data-testid="header">Header content</CardHeader>)
      
      const header = screen.getByTestId('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    it('should apply custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header content</CardHeader>)
      
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('should render as h3 with default classes', () => {
      render(<CardTitle data-testid="title">Card Title</CardTitle>)
      
      const title = screen.getByTestId('title')
      expect(title).toBeInTheDocument()
      expect(title.tagName).toBe('H3')
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
    })

    it('should apply custom className', () => {
      render(<CardTitle className="custom-title" data-testid="title">Card Title</CardTitle>)
      
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('custom-title')
    })

    it('should support all HTML heading attributes', () => {
      render(
        <CardTitle 
          id="test-title" 
          data-testid="title"
          aria-level="2"
        >
          Card Title
        </CardTitle>
      )
      
      const title = screen.getByTestId('title')
      expect(title).toHaveAttribute('id', 'test-title')
      expect(title).toHaveAttribute('aria-level', '2')
    })
  })

  describe('CardDescription', () => {
    it('should render as p with default classes', () => {
      render(<CardDescription data-testid="description">Card description</CardDescription>)
      
      const description = screen.getByTestId('description')
      expect(description).toBeInTheDocument()
      expect(description.tagName).toBe('P')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    it('should apply custom className', () => {
      render(<CardDescription className="custom-description" data-testid="description">Card description</CardDescription>)
      
      const description = screen.getByTestId('description')
      expect(description).toHaveClass('custom-description')
    })
  })

  describe('CardContent', () => {
    it('should render with default classes', () => {
      render(<CardContent data-testid="content">Card content</CardContent>)
      
      const content = screen.getByTestId('content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('p-6', 'pt-0')
    })

    it('should apply custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Card content</CardContent>)
      
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('CardFooter', () => {
    it('should render with default classes', () => {
      render(<CardFooter data-testid="footer">Footer content</CardFooter>)
      
      const footer = screen.getByTestId('footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })

    it('should apply custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer content</CardFooter>)
      
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('Complete Card Structure', () => {
    it('should render a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      )
      
      expect(screen.getByTestId('complete-card')).toBeInTheDocument()
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('This is a test card description')).toBeInTheDocument()
      expect(screen.getByText('This is the card content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
    })

    it('should render card with only required components', () => {
      render(
        <Card data-testid="minimal-card">
          <CardContent>
            <p>Minimal card content</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByTestId('minimal-card')).toBeInTheDocument()
      expect(screen.getByText('Minimal card content')).toBeInTheDocument()
    })
  })
})
