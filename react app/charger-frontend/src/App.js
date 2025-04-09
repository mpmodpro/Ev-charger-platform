import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, Container, Badge, Card, Row, Col, Button, Form, InputGroup, Dropdown, Modal, Spinner, Offcanvas, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faPlus, faBolt, faMapMarkerAlt, faEdit, faTrash, faPowerOff, faCheck, faTimes, faMoon, faSun, faSync } from '@fortawesome/free-solid-svg-icons';

// Theme toggle context
const ThemeContext = React.createContext();

// Charger List Component
const ChargerList = () => {
  const [chargers, setChargers] = useState([]);
  const [filteredChargers, setFilteredChargers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailable, setFilterAvailable] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChargerId, setSelectedChargerId] = useState(null);
  const [showFilterOffcanvas, setShowFilterOffcanvas] = useState(false);
  const { darkMode } = React.useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch chargers from API
    fetchChargers();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let results = chargers;
    
    // Filter by availability
    if (filterAvailable !== 'all') {
      const isAvailable = filterAvailable === 'available';
      results = results.filter(charger => charger.available === isAvailable);
    }
    
    // Apply search term
    if (searchTerm) {
      results = results.filter(charger => 
        charger.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        charger.id.toString().includes(searchTerm)
      );
    }
    
    setFilteredChargers(results);
  }, [chargers, searchTerm, filterAvailable]);

  const fetchChargers = async () => {
    try {
      
      const response = await fetch('http://localhost:5000/chargers');
      const data = await response.json();
      
      
      // Simulate API delay
      setTimeout(() => {
        setChargers(data);
        setFilteredChargers(data);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Failed to fetch chargers. Please try again later.');
      setLoading(false);
      console.error("Error fetching chargers:", err);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchChargers();
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  const openDeleteModal = (id) => {
    setSelectedChargerId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
       await fetch(`http://localhost:5000/chargers/${selectedChargerId}`, {
         method: 'DELETE'
       });
      
      // Update local state
      const updatedChargers = chargers.filter(charger => charger.id !== selectedChargerId);
      setChargers(updatedChargers);
      setShowDeleteModal(false);
      
      // Success notification could be added here
    } catch (err) {
      console.error("Error deleting charger:", err);
      // Error notification could be added here
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      const charger = chargers.find(c => c.id === id);
      
      
      await fetch(`http://localhost:5000/chargers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ available: !charger.available }),
      });
      
      // Update local state
      const updatedChargers = chargers.map(c => 
        c.id === id ? { ...c, available: !c.available } : c
      );
      setChargers(updatedChargers);
      
      // Success notification could be added here
    } catch (err) {
      console.error("Error updating charger availability:", err);
      // Error notification could be added here
    }
  };

  if (loading) return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-2">Loading chargers...</p>
    </div>
  );
  
  if (error) return (
    <div className="alert alert-danger my-4" role="alert">
      <h4 className="alert-heading">Error!</h4>
      <p>{error}</p>
      <hr />
      <Button variant="outline-danger" onClick={handleRefresh}>
        <FontAwesomeIcon icon={faSync} className="me-2" />
        Try Again
      </Button>
    </div>
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className={`mb-0 ${darkMode ? 'text-light' : ''}`}>
          <FontAwesomeIcon icon={faBolt} className="text-warning me-2" />
          Charger Stations
        </h2>
        <div className="d-flex">
          <Button variant="outline-primary" onClick={handleRefresh} className="me-2">
            <FontAwesomeIcon icon={faSync} spin={loading} />
          </Button>
          <Button variant="primary" as={Link} to="/add">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add New
          </Button>
        </div>
      </div>

      <Card className={`mb-4 ${darkMode ? 'bg-dark text-light border-secondary' : ''}`}>
        <Card.Body>
          <div className="d-flex flex-wrap gap-2">
            <InputGroup className="me-2" style={{ maxWidth: '350px' }}>
              <InputGroup.Text id="search-addon">
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by location or ID"
                aria-label="Search"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </InputGroup>
            
            <Dropdown className="me-2">
              <Dropdown.Toggle variant={darkMode ? "outline-light" : "outline-dark"} id="dropdown-availability">
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                {filterAvailable === 'all' 
                  ? 'All Chargers' 
                  : filterAvailable === 'available' 
                    ? 'Available Only'
                    : 'Unavailable Only'
                }
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setFilterAvailable('all')}>All Chargers</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterAvailable('available')}>Available Only</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterAvailable('unavailable')}>Unavailable Only</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            
            <Button 
              variant={darkMode ? "outline-light" : "outline-dark"}
              onClick={() => setShowFilterOffcanvas(true)}
            >
              Advanced Filters
            </Button>
          </div>
        </Card.Body>
      </Card>
      
      <div className="mb-3">
        <small className={darkMode ? 'text-light' : 'text-muted'}>
          Showing {filteredChargers.length} of {chargers.length} chargers
        </small>
      </div>

      {filteredChargers.length === 0 ? (
        <div className={`text-center py-5 ${darkMode ? 'text-light' : ''}`}>
          <h5>No chargers match your search criteria</h5>
          <p>Try adjusting your filters or search term</p>
          <Button variant="outline-primary" onClick={() => {
            setSearchTerm('');
            setFilterAvailable('all');
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <Row>
          {filteredChargers.map(charger => (
            <Col key={charger.id} lg={4} md={6} sm={12} className="mb-4">
              <Card className={`h-100 ${darkMode ? 'bg-dark text-light border-secondary' : ''}`}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" /></span>
                  <Badge bg={charger.available ? "success" : "danger"} className="px-3 py-2">
                    {charger.available ? 
                      <><FontAwesomeIcon icon={faCheck} /> Available</> : 
                      <><FontAwesomeIcon icon={faTimes} /> In Use</>}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <Card.Title>{charger.location}</Card.Title>
                  <div className="mb-3">
                    <small className={darkMode ? 'text-light' : 'text-muted'}>ID: {charger.id}</small>
                  </div>
                  <div className="d-flex flex-column gap-2 mb-3">
                    <div><strong>Type:</strong> {charger.type}</div>
                    <div><strong>Power:</strong> {charger.power}</div>
                    <div><strong>Last Used:</strong> {new Date(charger.lastUsed).toLocaleString()}</div>
                  </div>
                </Card.Body>
                <Card.Footer className={`d-flex justify-content-between ${darkMode ? 'bg-dark border-secondary' : ''}`}>
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip>Toggle Availability</Tooltip>}
                  >
                    <Button 
                      variant={charger.available ? "outline-success" : "outline-danger"} 
                      size="sm"
                      onClick={() => handleToggleAvailability(charger.id)}
                    >
                      <FontAwesomeIcon icon={faPowerOff} />
                    </Button>
                  </OverlayTrigger>
                  
                  <div className="d-flex gap-2">
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Edit Charger</Tooltip>}
                    >
                      <Button 
                        variant={darkMode ? "outline-light" : "outline-dark"} 
                        size="sm"
                        onClick={() => handleEdit(charger.id)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                    </OverlayTrigger>
                    
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Delete Charger</Tooltip>}
                    >
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => openDeleteModal(charger.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </OverlayTrigger>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className={darkMode ? 'bg-dark text-light' : ''}>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body className={darkMode ? 'bg-dark text-light' : ''}>
          Are you sure you want to delete this charger? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className={darkMode ? 'bg-dark text-light' : ''}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Advanced Filters Offcanvas */}
      <Offcanvas 
        show={showFilterOffcanvas} 
        onHide={() => setShowFilterOffcanvas(false)} 
        placement="end"
        className={darkMode ? 'bg-dark text-light' : ''}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Advanced Filters</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Charger Type</Form.Label>
              <Form.Select className={darkMode ? 'bg-dark text-light' : ''}>
                <option value="">All Types</option>
                <option value="CCS">CCS</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="Type 1">Type 1</option>
                <option value="Type 2">Type 2</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Power Range</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control 
                  type="number" 
                  placeholder="Min kW"
                  className={darkMode ? 'bg-dark text-light' : ''}
                />
                <Form.Control 
                  type="number" 
                  placeholder="Max kW"
                  className={darkMode ? 'bg-dark text-light' : ''}
                />
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Last Used</Form.Label>
              <Form.Select className={darkMode ? 'bg-dark text-light' : ''}>
                <option value="">Any Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-grid gap-2">
              <Button variant="primary">
                Apply Filters
              </Button>
              <Button variant="outline-secondary">
                Reset
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
};

// Add/Edit Charger Form Component
const ChargerForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEditMode);
  const [message, setMessage] = useState(null);
  const { darkMode } = React.useContext(ThemeContext);
  
  const [formData, setFormData] = useState({
    location: '',
    available: true,
    power: '',
    type: '',
    notes: ''
  });

  useEffect(() => {
    if (isEditMode) {
      
      const fetchChargerDetails = async () => {
        try {
          const response = await fetch(`http://localhost:5000/chargers/${id}`);
          const data = await response.json();
          setFormData(data);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching charger details:", err);
          setLoading(false);
        }
      };
      fetchChargerDetails();
      
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      
      const url = isEditMode 
        ? `http://localhost:5000/chargers/${id}`
        : 'http://localhost:5000/chargers';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMessage({
        type: 'success',
        text: isEditMode ? 'Charger updated successfully!' : 'Charger added successfully!'
      });
      
      if (!isEditMode) {
        // Reset form for add mode
        setFormData({
          location: '',
          available: true,
          power: '',
          type: '',
          notes: ''
        });
      }
      
      setLoading(false);
      
      // Navigate back to list after short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (err) {
      setMessage({
        type: 'danger',
        text: isEditMode ? 'Failed to update charger.' : 'Failed to add charger.'
      });
      setLoading(false);
      console.error("Error saving charger:", err);
    }
  };

  if (loading && isEditMode) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className={`mt-2 ${darkMode ? 'text-light' : ''}`}>Loading charger details...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className={`mb-4 ${darkMode ? 'text-light' : ''}`}>
        <FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="me-2" />
        {isEditMode ? 'Edit Charger' : 'Add New Charger'}
      </h2>
      
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}
      
      <Card className={darkMode ? 'bg-dark text-light border-secondary' : ''}>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Charger Location*</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Downtown Parking Garage"
                    required
                    className={darkMode ? 'bg-dark text-light' : ''}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Charger Type*</Form.Label>
                  <Form.Select 
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className={darkMode ? 'bg-dark text-light' : ''}
                  >
                    <option value="">Select Type</option>
                    <option value="CCS">CCS</option>
                    <option value="CHAdeMO">CHAdeMO</option> 
                    <option value="Type 1">Type 1</option>
                    <option value="Type 2">Type 2</option>
                    <option value="CCS/CHAdeMO">CCS/CHAdeMO</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Power Rating (kW)*</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="number" 
                      name="power"
                      value={formData.power}
                      onChange={handleChange}
                      placeholder="e.g. 50"
                      required
                      className={darkMode ? 'bg-dark text-light' : ''}
                    />
                    <InputGroup.Text className={darkMode ? 'bg-dark text-light border-secondary' : ''}>kW</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Availability Status</Form.Label>
                  <div className="mt-2">
                    <Form.Check 
                      type="switch"
                      id="available-switch"
                      label={formData.available ? "Available" : "Not Available"}
                      name="available"
                      checked={formData.available}
                      onChange={handleChange}
                      className="form-switch-lg"
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional details about this charger..."
                className={darkMode ? 'bg-dark text-light' : ''}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                    {isEditMode ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  isEditMode ? 'Update Charger' : 'Add Charger'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

// Not Found Component
const NotFound = () => {
  const { darkMode } = React.useContext(ThemeContext);
  return (
    <Container className="py-5 text-center">
      <h2 className={darkMode ? 'text-light' : ''}>404 - Page Not Found</h2>
      <p className={darkMode ? 'text-light' : ''}>The page you are looking for does not exist.</p>
      <Button as={Link} to="/" variant="primary">Return to Dashboard</Button>
    </Container>
  );
};

// Import missing hooks
const { useParams } = require('react-router-dom');

// Main App Component
function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check for saved preference or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('bg-dark');
    } else {
      document.body.classList.remove('bg-dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <Router>
        <div className="App">
          <Navbar bg={darkMode ? "dark" : "dark"} variant="dark" expand="lg" className="shadow-sm">
            <Container>
              <Navbar.Brand as={Link} to="/">
                <FontAwesomeIcon icon={faBolt} className="text-warning me-2" />
                Charger Manager
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/">View Chargers</Nav.Link>
                  <Nav.Link as={Link} to="/add">Add Charger</Nav.Link>
                </Nav>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  onClick={toggleDarkMode}
                  className="d-flex align-items-center"
                >
                  <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
                  <span className="ms-2 d-none d-sm-inline">
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </Button>
              </Navbar.Collapse>
            </Container>
          </Navbar>

          <div className="min-vh-100">
            <Routes>
              <Route path="/" element={<ChargerList />} />
              <Route path="/add" element={<ChargerForm />} />
              <Route path="/edit/:id" element={<ChargerForm />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          
          <footer className={`py-3 mt-4 border-top ${darkMode ? 'bg-dark text-light border-secondary' : ''}`}>
            <Container className="text-center">
              <p className="mb-0">
                <small>&copy; 2025 Charger Management System</small>
              </p>
            </Container>
          </footer>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;