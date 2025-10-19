import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '../components/ui/alert-dialog';
import { Trash2, MoreVertical } from 'lucide-react';

interface Syllabus {
  id: number;
  course_name: string;
  instructor: string;
  semester: string;
  keyDates: any[];
  topics: string[];
  gradingBreakdown: any[];
  created_at: string;
}

interface SyllabusManagerProps {
  authToken: string;
  onSelectSyllabus: (syllabus: Syllabus) => void;
  apiBaseUrl?: string;
}

export const SyllabusManager: React.FC<SyllabusManagerProps> = ({
  authToken,
  onSelectSyllabus,
  apiBaseUrl = 'http://localhost:5000'
}) => {
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSyllabi();
  }, [authToken]);

  const fetchSyllabi = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/syllabus/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch syllabi');
      }

      setSyllabi(data.syllabi);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load syllabi');
      setSyllabi([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSyllabus = async (id: number) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/syllabus/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete syllabus');
      }

      setSyllabi(syllabi.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete syllabus');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <p className="text-gray-500">Loading your syllabi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSyllabi}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {syllabi.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-2">No syllabi uploaded yet</p>
            <p className="text-sm text-gray-400">Upload your first syllabus to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {syllabi.map((syllabus) => (
            <Card key={syllabus.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader
                className="pb-3"
                onClick={() => onSelectSyllabus(syllabus)}
              >
                <CardTitle className="text-lg line-clamp-2">
                  {syllabus.course_name}
                </CardTitle>
                <CardDescription>{syllabus.semester}</CardDescription>
              </CardHeader>
              <CardContent
                className="pb-4"
                onClick={() => onSelectSyllabus(syllabus)}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Instructor:</span>
                    <span className="font-medium">{syllabus.instructor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exams:</span>
                    <span className="font-medium">
                      {syllabus.keyDates?.filter((d: any) => d.type === 'exam').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Topics:</span>
                    <span className="font-medium">
                      {syllabus.topics?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grading:</span>
                    <span className="font-medium">
                      {syllabus.gradingBreakdown?.length || 0} categories
                    </span>
                  </div>
                </div>
              </CardContent>

              <div className="px-4 py-3 border-t flex justify-end gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Delete Syllabus</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{syllabus.course_name}"? This action cannot be undone.
                    </AlertDialogDescription>
                    <div className="flex justify-end gap-2">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteSyllabus(syllabus.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
