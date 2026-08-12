// ReportUploadForm.test.jsx — correction du test 422
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportUploadForm from '../src/components/ReportUploadForm';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { post: vi.fn() },
}));

const LOAD_TIMEOUT = { timeout: 3000 };
const PUBLIC_ID = '#VEN-INT-AAA11111';

function makeFile(name = 'report.pdf', type = 'application/pdf') {
  return new File(['dummy content'], name, { type });
}

beforeEach(() => {
  api.post.mockReset();
});

describe('ReportUploadForm', () => {
  it('renders the findings textarea and the drop zone', () => {
    render(<ReportUploadForm interventionPublicId={PUBLIC_ID} />);
    expect(screen.getByLabelText('Field findings')).toBeInTheDocument();
    expect(screen.getByText(/drag and drop a file or/i)).toBeInTheDocument();
  });

  it('shows an error when submitting without a file', async () => {
    render(<ReportUploadForm interventionPublicId={PUBLIC_ID} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /submit report/i }));
    expect(
      await screen.findByText(/a file is required to submit the report/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows the selected file name and allows removing it', async () => {
    render(<ReportUploadForm interventionPublicId={PUBLIC_ID} />);
    const file = makeFile();
    const user = userEvent.setup();
    await user.upload(screen.getByLabelText(/drag and drop a file or/i), file);
    expect(await screen.findByText('report.pdf', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /remove file/i }));
    expect(screen.queryByText('report.pdf')).not.toBeInTheDocument();
  });

  it('submits the form and calls onSuccess with the created report', async () => {
    const onSuccess = vi.fn();
    api.post.mockResolvedValue({ data: { id: 9, contenu: 'All good.' } });

    render(<ReportUploadForm interventionPublicId={PUBLIC_ID} onSuccess={onSuccess} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Field findings'), 'All good.');
    await user.upload(screen.getByLabelText(/drag and drop a file or/i), makeFile());
    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        `/technicien/interventions/${encodeURIComponent(PUBLIC_ID)}/report`,
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    }, LOAD_TIMEOUT);

    expect(onSuccess).toHaveBeenCalledWith({ id: 9, contenu: 'All good.' });
    expect(screen.queryByText('report.pdf')).not.toBeInTheDocument();
  });

  it('shows field-specific 422 errors from the backend', async () => {
    api.post.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: { fichier: ['The fichier must be a file of type: pdf, jpg, jpeg, png, docx.'] } },
      },
    });

    render(<ReportUploadForm interventionPublicId={PUBLIC_ID} />);
    const user = userEvent.setup();
    // Utiliser une extension valide (.pdf) mais un type MIME invalide pour que le fichier soit accepté par l'input
    const file = makeFile('report.pdf', 'text/plain');

    await user.upload(screen.getByLabelText(/drag and drop a file or/i), file);
    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    }, LOAD_TIMEOUT);

    expect(await screen.findByText(/file of type/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });

  it('shows a generic error on a non-422 failure', async () => {
    api.post.mockRejectedValue(new Error('network error'));

    render(<ReportUploadForm interventionPublicId={PUBLIC_ID} />);
    const user = userEvent.setup();
    await user.upload(screen.getByLabelText(/drag and drop a file or/i), makeFile());
    await user.click(screen.getByRole('button', { name: /submit report/i }));

    expect(
      await screen.findByText(/unable to submit this report/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });
});