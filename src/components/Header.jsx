import React from "react";
import { Navbar, Nav, Form, FormControl, Button, Container, Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container>
        {/* Logo */}
        <Navbar.Brand as={Link} to="/">
          <img
            src="/logo.png" // Đổi thành đường dẫn logo của bạn
            alt="Gentle Blossom"
            width="150"
          />
        </Navbar.Brand>

        {/* Toggle Button khi thu nhỏ */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Thanh điều hướng */}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Trang chủ</Nav.Link>
            <Nav.Link as={Link} to="/profile">Trang cá nhân</Nav.Link>
            <Nav.Link as={Link} to="/health-tracking">Theo dõi sức khỏe</Nav.Link>
            <Nav.Link as={Link} to="/articles">Bài viết</Nav.Link>
            <Nav.Link as={Link} to="/message">Tin nhắn</Nav.Link>
          </Nav>

          {/* Ô tìm kiếm */}
          <Form className="d-flex me-3">
            <FormControl type="search" placeholder="Tìm kiếm..." className="me-2" />
            <Button variant="outline-success">Tìm</Button>
          </Form>

          {/* Nút thông báo */}
          <Button variant="outline-secondary" className="me-3">
            🔔
          </Button>

          {/* Ảnh đại diện & Dropdown */}
          <Dropdown>
            <Dropdown.Toggle variant="light" id="dropdown-basic">
              <img
                src="/user-avatar.png" // Đổi thành ảnh đại diện của người dùng
                alt="User Avatar"
                width="40"
                height="40"
                className="rounded-circle"
              />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} to="/profile">Trang cá nhân</Dropdown.Item>
              <Dropdown.Item as={Link} to="/settings">Cài đặt</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item as={Link} to="/logout">Đăng xuất</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
