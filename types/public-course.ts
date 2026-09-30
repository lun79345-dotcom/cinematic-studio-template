export type PublicCourseLesson = {
  id: string;
  title: string;
  duration: number;
  order: number;
  summary: string;
  videoUrl?: string;
};

export type PublicCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  instructorName: string;
  instructorTitle: string;
  category: string;
  level: string;
  duration: string;
  originalPrice: number;
  price: number;
  cover: string;
  featured: boolean;
  outcomes: string[];
  lessons: PublicCourseLesson[];
};

export type PublicCoursesResponse = {
  courses: PublicCourse[];
};
