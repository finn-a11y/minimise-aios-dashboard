import React from 'react';
import { useParams } from 'react-router-dom';
import PagePlaceholder from './PagePlaceholder';

export default function AiosDepartment() {
  const { slug } = useParams();
  return (
    <PagePlaceholder
      title={`Department: ${slug}`}
      description="Department drill-down — scoped hero, skills in dept, tasks (auto + manual), recent runs. Wired in Stream 3."
    />
  );
}
