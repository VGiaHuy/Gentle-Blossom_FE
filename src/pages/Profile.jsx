import { Container, Row, Col, Card, ListGroup, Button } from "react-bootstrap";

const Profile = () => {
  const user = {
    name: "Nguyễn Thị An",
    email: "an.nguyen@example.com",
    avatar: "https://via.placeholder.com/150",
    role: "Thai phụ",
  };

  const healthRecords = [
    { id: 1, date: "10/02/2025", status: "Tốt" },
    { id: 2, date: "20/02/2025", status: "Cần theo dõi" },
  ];

  const mentalLogs = [
    { id: 1, date: "12/02/2025", mood: "Vui vẻ", note: "Hôm nay cảm thấy rất thoải mái!" },
    { id: 2, date: "22/02/2025", mood: "Lo lắng", note: "Có một chút lo lắng về sức khỏe bé." },
  ];

  const posts = [
    { id: 1, title: "Chia sẻ kinh nghiệm mang thai tháng thứ 3" },
    { id: 2, title: "Bí quyết giữ sức khỏe trong thai kỳ" },
  ];

  return (
    <Container className="mt-4">
      {/* Phần trên cùng: Thông tin cá nhân */}
      <Card className="shadow mb-4">
        <Card.Body className="text-center">
          <Row className="align-items-center">
            <Col md={3} className="text-center">
              <img
                src={user.avatar}
                alt="Avatar"
                className="rounded-circle mb-3"
                width="120"
              />
            </Col>
            <Col md={6}>
              <h4>{user.name}</h4>
              <p className="text-muted">{user.role}</p>
              <p>Email: {user.email}</p>
            </Col>
            <Col md={3} className="text-center">
              <Button variant="primary">Chỉnh sửa thông tin</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        {/* Phần danh sách bài viết */}
        <Col md={6}>
          <Card className="shadow">
            <Card.Header className="bg-success text-white">Bài Viết Đã Đăng</Card.Header>
            <ListGroup variant="flush">
              {posts.map((post) => (
                <ListGroup.Item key={post.id}>{post.title}</ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        {/* Phần bên phải (chia thành 2 phần) */}
        <Col md={6}>
          {/* Phiếu theo dõi sức khỏe */}
          <Card className="shadow mb-3">
            <Card.Header className="bg-primary text-white">Phiếu Theo Dõi Sức Khỏe</Card.Header>
            <ListGroup variant="flush">
              {healthRecords.map((record) => (
                <ListGroup.Item key={record.id}>
                  <strong>Ngày:</strong> {record.date} <br />
                  <strong>Trạng thái:</strong> {record.status}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>

          {/* Nhật ký tâm lý */}
          <Card className="shadow">
            <Card.Header className="bg-warning text-dark">Nhật Ký Tâm Lý</Card.Header>
            <ListGroup variant="flush">
              {mentalLogs.map((log) => (
                <ListGroup.Item key={log.id}>
                  <strong>Ngày:</strong> {log.date} <br />
                  <strong>Cảm xúc:</strong> {log.mood} <br />
                  <em>{log.note}</em>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
