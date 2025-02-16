import React, { useState } from "react";
import { Container, Row, Col, Form, InputGroup, Button, ListGroup } from "react-bootstrap";
import { FaSearch, FaPaperPlane, FaSmile, FaUserCircle } from "react-icons/fa";

const Message = () => {
  const [messages, setMessages] = useState([
    { sender: "me", text: "Chào bác sĩ, tôi cần tư vấn!" },
    { sender: "doctor", text: "Xin chào, tôi có thể giúp gì cho bạn?" },
  ]);
  const [input, setInput] = useState("");

  const handleSendMessage = () => {
    if (input.trim() === "") return;
    setMessages([...messages, { sender: "me", text: input }]);
    setInput("");
  };

  return (
    <Container fluid className="vh-100 d-flex flex-column">
      <Row className="flex-grow-1">
        {/* Sidebar danh sách cuộc trò chuyện */}
        <Col md={3} className="bg-light border-end p-3">
          <h5 className="mb-3">Tin nhắn</h5>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control type="text" placeholder="Tìm kiếm..." />
          </InputGroup>
          <ListGroup>
            <ListGroup.Item action className="d-flex align-items-center">
              <FaUserCircle size={30} className="me-2" />
              <span>Bác sĩ A</span>
            </ListGroup.Item>
            <ListGroup.Item action className="d-flex align-items-center">
              <FaUserCircle size={30} className="me-2" />
              <span>Bác sĩ B</span>
            </ListGroup.Item>
          </ListGroup>
        </Col>

        {/* Khung chat chính */}
        <Col md={9} className="d-flex flex-column">
          <div className="p-3 border-bottom bg-white d-flex align-items-center shadow-sm">
            <FaUserCircle size={40} className="me-2" />
            <h5 className="m-0">Bác sĩ A</h5>
          </div>

          {/* Khu vực hiển thị tin nhắn */}
          <div className="flex-grow-1 p-3 overflow-auto" style={{ background: "#f8f9fa" }}>
            {messages.map((msg, index) => (
              <div key={index} className={`d-flex mb-2 ${msg.sender === "me" ? "justify-content-end" : ""}`}>
                <div
                  className={`p-2 rounded ${msg.sender === "me" ? "bg-primary text-white" : "bg-light"}`}
                  style={{ maxWidth: "70%" }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="p-3 border-top bg-white d-flex align-items-center">
            <FaSmile size={24} className="me-2 text-muted" />
            <Form.Control
              type="text"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="me-2"
            />
            <Button variant="primary" onClick={handleSendMessage}>
              <FaPaperPlane />
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Message;
