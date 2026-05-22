// Mock API service for development when backend is not available
export const mockDoctors = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialization: "Cardiologist",
    department: "Cardiology",
    experience: 15,
    available_days: "Mon-Fri",
    timings: "9:00 AM - 5:00 PM",
    rating: 4.8,
    qualification: "MD, FACC",
    is_active: true
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialization: "Neurologist",
    department: "Neurology",
    experience: 12,
    available_days: "Mon-Sat",
    timings: "10:00 AM - 6:00 PM",
    rating: 4.9,
    qualification: "MD, PhD",
    is_active: true
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    specialization: "Pediatrician",
    department: "Pediatrics",
    experience: 8,
    available_days: "Mon-Fri",
    timings: "8:00 AM - 4:00 PM",
    rating: 4.7,
    qualification: "MD, FAAP",
    is_active: true
  }
];

export const mockDepartments = [
  { id: 1, name: "Cardiology", description: "Heart and cardiovascular care", icon: "fas fa-heartbeat" },
  { id: 2, name: "Neurology", description: "Brain and nervous system care", icon: "fas fa-brain" },
  { id: 3, name: "Pediatrics", description: "Children's healthcare", icon: "fas fa-baby" },
  { id: 4, name: "Orthopedics", description: "Bone and joint care", icon: "fas fa-bone" }
];

export const mockSlots = [
  { time: "09:00 AM", available: true, status: "available" as const },
  { time: "09:30 AM", available: true, status: "available" as const },
  { time: "10:00 AM", available: false, status: "booked" as const },
  { time: "10:30 AM", available: true, status: "available" as const },
  { time: "11:00 AM", available: true, status: "available" as const },
  { time: "11:30 AM", available: false, status: "booked" as const },
  { time: "02:00 PM", available: true, status: "available" as const },
  { time: "02:30 PM", available: true, status: "available" as const },
  { time: "03:00 PM", available: true, status: "available" as const },
  { time: "03:30 PM", available: false, status: "booked" as const }
];

export const mockEvents = [
  {
    id: 1,
    title: "Free Health Checkup Camp",
    description: "Comprehensive health screening for all ages",
    datetime: "2026-06-01T09:00:00",
    category: "Event" as const,
    image: "/api/placeholder/400/200"
  },
  {
    id: 2,
    title: "New Cardiac Care Unit Opened",
    description: "State-of-the-art cardiac care facility now available",
    datetime: "2026-05-15T10:00:00",
    category: "News" as const,
    image: "/api/placeholder/400/200"
  }
];

export const mockAchievements = [
  { id: 1, title: "Patients Served", value: "50,000+", icon: "fas fa-users" },
  { id: 2, title: "Years of Service", value: "25+", icon: "fas fa-calendar" },
  { id: 3, title: "Specialist Doctors", value: "200+", icon: "fas fa-user-md" },
  { id: 4, title: "Success Rate", value: "98%", icon: "fas fa-chart-line" }
];

export const mockCompliments = [
  {
    id: 1,
    patient_name: "John Smith",
    message: "Excellent care and professional staff. Highly recommended!",
    rating: 5,
    date: "2026-05-10",
    department: "Cardiology"
  },
  {
    id: 2,
    patient_name: "Mary Johnson",
    message: "The doctors are very knowledgeable and caring. Great experience!",
    rating: 5,
    date: "2026-05-08",
    department: "Pediatrics"
  }
];

export const mockTicker = [
  { icon: "fas fa-bullhorn", text: "New COVID-19 vaccination drive starts Monday" },
  { icon: "fas fa-calendar", text: "Free health checkup camp on June 1st, 2026" },
  { icon: "fas fa-award", text: "Hospital awarded Best Healthcare Provider 2026" }
];