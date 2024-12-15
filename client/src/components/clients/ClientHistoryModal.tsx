import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { TimeframeSelector } from '../TimeframeSelector';
import { formatNumber } from '../../utils/formatUtils';

type ClientHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  client?: {
    id: string;
    name: string;
  };
  history?: {
    appointments: any[];
    history: Record<string, any>;
    stats: {
      totalAppointments: number;
      totalTurnover: number;
      periodLabel: string;
    };
  };
  handleTimeframeChange?: (timeframe: string) => void;
};

type AppointmentDetailsProps = {
  appointment: any;
  onClose: () => void;
};

function AppointmentDetails({ appointment, onClose }: AppointmentDetailsProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Detalji termina</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Datum i vreme</p>
          <p className="text-base">{appointment.date} u {appointment.time}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Usluga</p>
          <p className="text-base">{appointment.service}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Terapeut</p>
          <p className="text-base">{appointment.therapist}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(appointment.status)}`}>
            {appointment.status}
          </span>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Cena</p>
          <p className="text-base">{formatNumber(appointment.price)} RSD</p>
        </div>

        {appointment.notes && (
          <div>
            <p className="text-sm text-gray-500">Napomene</p>
            <p className="text-base">{appointment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientHistoryModal({ isOpen, onClose, client, history, handleTimeframeChange }: ClientHistoryModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [timeframe, setTimeframe] = useState('thisMonth');

  const ITEMS_PER_PAGE = 10;

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'POTVRĐENO':
        return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20';
      case 'CANCELED':
      case 'OTKAZANO':
        return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
      case 'NO_SHOW':
      case 'NIJE SE POJAVIO/LA':
        return 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20';
      case 'SCHEDULED':
      case 'ZAKAZANO':
        return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
      case 'IN_PROGRESS':
      case 'U TOKU':
        return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
      case 'PENDING':
      case 'NA ČEKANJU':
        return 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20';
    }
  };

  const translateStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return 'POTVRĐENO';
      case 'CANCELED':
        return 'OTKAZANO';
      case 'NO_SHOW':
        return 'NIJE SE POJAVIO/LA';
      case 'SCHEDULED':
        return 'ZAKAZANO';
      case 'IN_PROGRESS':
        return 'U TOKU';
      case 'PENDING':
        return 'NA ČEKANJU';
      default:
        return status;
    }
  };

  // Get all appointments from history with null checks
  const allAppointments = history?.appointments || [];
  const monthlyStats = Object.entries(history?.history || {}).map(([month, data]: [string, any]) => ({
    month,
    ...data
  }));

  const totalPages = Math.ceil(allAppointments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAppointments = allAppointments.slice(startIndex, endIndex);
  const stats = history?.stats || { totalAppointments: 0, totalTurnover: 0, periodLabel: '' };

  const handleTimeframeSelect = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    handleTimeframeChange?.(newTimeframe);
  };

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl sm:p-6">
                  <div className="absolute right-0 top-0 pr-4 pt-4 z-10">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <div className="flex justify-between items-center mb-4 pr-8">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          Istorija termina {client?.name ? `- ${client.name}` : ''}
                        </Dialog.Title>
                        <TimeframeSelector
                          timeframe={timeframe}
                          onChange={handleTimeframeSelect}
                        />
                      </div>

                      {/* Stats Summary */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg shadow">
                          <h4 className="text-sm font-medium text-gray-500">Ukupno termina</h4>
                          <p className="text-xl font-semibold">{stats.totalAppointments}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow">
                          <h4 className="text-sm font-medium text-gray-500">Ukupan prihod</h4>
                          <p className="text-xl font-semibold">{formatNumber(stats.totalTurnover)} RSD</p>
                        </div>
                      </div>

                      {/* History Stats */}
                      <div className="mb-4">
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                          <div className="px-3 py-3">
                            <h4 className="text-base font-semibold mb-2">Statistika za period: {stats.periodLabel}</h4>
                            <div className="flex justify-end items-center p-2 text-sm">
                              <span className="text-gray-500 mr-4">Termini: {stats.totalAppointments}</span>
                              <span className="font-medium">{formatNumber(stats.totalTurnover)} RSD</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Appointments Table */}
                      <div className="mt-4 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead>
                                <tr>
                                  <th scope="col" className="py-2 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                    Datum
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                                    Vreme
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                                    Usluga
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                                    Terapeut
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                                    Status
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                                    Cena
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                                    Napomena
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {currentAppointments.map((appointment: any) => (
                                  <tr 
                                    key={appointment.id}
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => setSelectedAppointment(appointment)}
                                  >
                                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                      {appointment.date}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                      {appointment.time}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                      {appointment.service || 'N/A'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                      {appointment.therapist || 'N/A'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(appointment.status || 'UNKNOWN')}`}>
                                        {translateStatus(appointment.status || 'UNKNOWN')}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                      {formatNumber(appointment.price || 0)} RSD
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-500 max-w-xs truncate">
                                      {appointment.notes || 'Nema napomene'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                          <button
                            onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Prethodna
                          </button>
                          <button
                            onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Sledeća
                          </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Prikazano <span className="font-medium">{startIndex + 1}</span> do{' '}
                              <span className="font-medium">{Math.min(endIndex, allAppointments.length)}</span> od{' '}
                              <span className="font-medium">{allAppointments.length}</span> termina
                            </p>
                          </div>
                          <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                              <button
                                onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                              >
                                <span className="sr-only">Prethodna</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                              >
                                <span className="sr-only">Sledeća</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Detalji termina</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Datum: {selectedAppointment.date}
                  </p>
                  <p className="text-sm text-gray-500">
                    Vreme: {selectedAppointment.time}
                  </p>
                  <p className="text-sm text-gray-500">
                    Usluge: {selectedAppointment.service}
                  </p>
                  <p className="text-sm text-gray-500">
                    Ukupno: {formatNumber(selectedAppointment.price)} RSD
                  </p>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                  onClick={() => setSelectedAppointment(null)}
                >
                  Zatvori
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
