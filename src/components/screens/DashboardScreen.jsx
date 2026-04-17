import { CalendarIcon, StarIcon, DocumentIcon, UserIcon, HomeIcon, ReportIcon, ClockIcon } from '../shared/Icons.jsx';
import SchedulesTab from '../tabs/SchedulesTab.jsx';
import ApprovalsTab from '../tabs/ApprovalsTab.jsx';
import AdminRequestsTab from '../tabs/AdminRequestsTab.jsx';
import ProfessorRequestsTab from '../tabs/ProfessorRequestsTab.jsx';
import ProfileTab from '../tabs/ProfileTab.jsx';
import BuildingsTab from '../tabs/BuildingsTab.jsx';
import ReportsTab from '../tabs/ReportsTab.jsx';
import TimeLogsTab from '../tabs/TimeLogsTab.jsx';

export default function DashboardScreen({
  activeTab,
  onTabChange,
  isAdmin,
  welcomeTitle,
  welcomeDept,
  // Schedules tab props
  schedules,
  scheduleForm,
  onScheduleFormChange,
  onCreateSchedule,
  onDeleteSchedule,
  onTapIn,
  onTapOut,
  onStatusChange,
  adminCreateBusy,
  // Approvals tab props
  createProfForm,
  onCreateProfFormChange,
  onCreateProfessor,
  createProfBusy,
  createProfError,
  pendingProfessors,
  allUsers,
  onApproveProfessor,
  // Requests tab props
  changeRequests,
  onApproveRequest,
  onRejectRequest,
  authUser,
  // Professor requests props
  profRequestForm,
  onProfRequestFormChange,
  // Buildings tab props
  buildings,
  classrooms,
  onCreateBuilding,
  onCreateClassroom,
  onDeleteBuilding,
  onDeleteClassroom,
  onSubmitRequest,
  profReqBusy,
  // Profile tab props
  profile,
  qrUrl,
  onViewQr,
  onDownloadQr,
  // Reports tab props
  reports,
  onSubmitReport,
  onDeleteReport,
  reportSubmitBusy,
  // Time Logs props
  timeLogs,
  onOpenTimeLogScanner,
  scanBusy,
}) {
  return (
    <section className="screen">
      <div className="welcome">
        <div className="welcome__icon" aria-hidden="true">
          <UserIcon />
        </div>
        <div>
          <div className="welcome__title">{welcomeTitle}</div>
          <div className="welcome__sub">{welcomeDept}</div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'schedules' ? 'is-active' : ''}`}
          type="button"
          onClick={() => onTabChange('schedules')}
        >
          <span className="tab__icon" aria-hidden="true">
            <CalendarIcon />
          </span>
          Schedule Manager
        </button>

        {isAdmin ? (
          <>
            <button
              className={`tab ${activeTab === 'approvals' ? 'is-active' : ''}`}
              type="button"
              onClick={() => onTabChange('approvals')}
            >
              <span className="tab__icon" aria-hidden="true">
                <StarIcon />
              </span>
              Approvals
            </button>

            <button
              className={`tab ${activeTab === 'adminRequests' ? 'is-active' : ''}`}
              type="button"
              onClick={() => onTabChange('adminRequests')}
            >
              <span className="tab__icon" aria-hidden="true">
                <DocumentIcon />
              </span>
              Requests
            </button>

            <button
              className={`tab ${activeTab === 'buildings' ? 'is-active' : ''}`}
              type="button"
              onClick={() => onTabChange('buildings')}
            >
              <span className="tab__icon" aria-hidden="true">
                <HomeIcon />
              </span>
              Buildings
            </button>
          </>
        ) : (
          <>
            <button
              className={`tab ${activeTab === 'requests' ? 'is-active' : ''}`}
              type="button"
              onClick={() => onTabChange('requests')}
            >
              <span className="tab__icon" aria-hidden="true">
                <DocumentIcon />
              </span>
              Requests
            </button>

            <button
              className={`tab ${activeTab === 'timeLogs' ? 'is-active' : ''}`}
              type="button"
              onClick={() => onTabChange('timeLogs')}
            >
              <span className="tab__icon" aria-hidden="true">
                <ClockIcon />
              </span>
              Time Logs
            </button>
          </>
        )}

        <button
          className={`tab ${activeTab === 'reports' ? 'is-active' : ''}`}
          type="button"
          onClick={() => onTabChange('reports')}
        >
          <span className="tab__icon" aria-hidden="true">
            <ReportIcon />
          </span>
          Reports
        </button>

        <button
          className={`tab ${activeTab === 'profile' ? 'is-active' : ''}`}
          type="button"
          onClick={() => onTabChange('profile')}
        >
          <span className="tab__icon" aria-hidden="true">
            <UserIcon />
          </span>
          My Profile
        </button>
      </div>

      <div className="tabpanes">
        {activeTab === 'schedules' && (
          <SchedulesTab
            isAdmin={isAdmin}
            schedules={schedules}
            form={scheduleForm}
            onFormChange={onScheduleFormChange}
            onCreate={onCreateSchedule}
            onDelete={onDeleteSchedule}
            onTapIn={onTapIn}
            onTapOut={onTapOut}
            onStatusChange={onStatusChange}
            createBusy={adminCreateBusy}
            allUsers={allUsers}
            buildings={buildings}
            classrooms={classrooms}
          />
        )}

        {activeTab === 'approvals' && isAdmin && (
          <ApprovalsTab
            createForm={createProfForm}
            onCreateFormChange={onCreateProfFormChange}
            onCreateProfessor={onCreateProfessor}
            createBusy={createProfBusy}
            createError={createProfError}
            pendingProfessors={pendingProfessors}
            allUsers={allUsers}
            onApprove={onApproveProfessor}
          />
        )}

        {activeTab === 'adminRequests' && isAdmin && (
          <AdminRequestsTab
            changeRequests={changeRequests}
            onApprove={onApproveRequest}
            onReject={onRejectRequest}
            adminUid={authUser?.uid}
          />
        )}

        {activeTab === 'buildings' && isAdmin && (
          <BuildingsTab
            buildings={buildings}
            classrooms={classrooms}
            onCreateBuilding={onCreateBuilding}
            onCreateClassroom={onCreateClassroom}
            onDeleteBuilding={onDeleteBuilding}
            onDeleteClassroom={onDeleteClassroom}
          />
        )}

        {activeTab === 'requests' && !isAdmin && (
          <ProfessorRequestsTab
            schedules={schedules}
            form={profRequestForm}
            onFormChange={onProfRequestFormChange}
            onSubmit={onSubmitRequest}
            submitBusy={profReqBusy}
            buildings={buildings}
            classrooms={classrooms}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            reports={reports}
            professors={allUsers?.filter((u) => u.role === 'professor') || []}
            onSubmitReport={onSubmitReport}
            onDeleteReport={onDeleteReport}
            submitBusy={reportSubmitBusy}
            isAdmin={isAdmin}
            currentUser={authUser}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile}
            qrUrl={qrUrl}
            onViewQr={onViewQr}
            onDownloadQr={onDownloadQr}
          />
        )}

        {activeTab === 'timeLogs' && !isAdmin && (
          <TimeLogsTab
            profile={profile}
            timeLogs={timeLogs}
            scanBusy={scanBusy}
            onOpenScanner={onOpenTimeLogScanner}
          />
        )}
      </div>
    </section>
  );
}
