import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const HomePage = () => {
  const doctors = [
    { id: 1, name: 'Dr. Nguyễn Văn A', specialty: 'Sản khoa' },
    { id: 2, name: 'Dr. Trần Thị B', specialty: 'Tâm lý học' },
    { id: 3, name: 'Dr. Lê Văn C', specialty: 'Sản khoa' }
  ];

  const posts = [
    { id: 1, author: 'Mẹ bầu 1', content: 'Hôm nay mình đi khám thai và bác sĩ bảo bé phát triển tốt!', time: '1 giờ trước' },
    { id: 2, author: 'Mẹ bầu 2', content: 'Có ai có kinh nghiệm về dưỡng thai 3 tháng đầu không?', time: '3 giờ trước' }
  ];

  return (
    <Container fluid className="mt-4">
      <Row>
        {/* Cột trái: Gợi ý bác sĩ */}
        <Col md={3}>
          <h5>Bác sĩ được gợi ý</h5>
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="mb-3">
              <Card.Body>
                <Card.Title>{doctor.name}</Card.Title>
                <Card.Text>{doctor.specialty}</Card.Text>
                <Button variant="primary">Kết nối</Button>
              </Card.Body>
            </Card>
          ))}
        </Col>

        {/* Cột giữa: Bài viết */}
        <Col md={6}>
          <h5>Bài viết</h5>
          {posts.map((post) => (
            <Card key={post.id} className="mb-3">
              <Card.Body>
                <Card.Title>{post.author}</Card.Title>
                <Card.Text>{post.content}</Card.Text>
                <Card.Footer className="text-muted">{post.time}</Card.Footer>
              </Card.Body>
            </Card>
          ))}
        </Col>

        {/* Cột phải: Có thể thêm thông tin khác */}
        <Col md={3}>
          <h5>Thông tin khác</h5>
          <p>Hiển thị thông báo, tin tức nổi bật hoặc tính năng mở rộng.</p>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
